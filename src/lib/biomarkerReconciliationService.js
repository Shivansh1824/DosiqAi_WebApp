import { supabase } from './supabaseClient';

/**
 * biomarkerReconciliationService.js
 * 
 * Reconciles raw extracted laboratory test parameters with the universal
 * biomarkers_mastertable and biomarkers_aliases database catalog.
 * 
 * 1. Checks extracted test names against known aliases (Bucket A).
 * 2. Sends unmapped tests to the check-biomarker AI Lite Reviewer (Bucket B).
 * 3. Persists records to lab_reports and test_results with automatic previous-visit
 *    delta calculation and clinical trajectory trending ('improving', 'worsening', 'stable').
 */

/**
 * Invokes the check-biomarker Edge Function / dev API.
 * 
 * @param {Array<Object>} unmappedItems - List of unmapped test parameters
 * @returns {Promise<Array<Object>>} Resolved clinical decisions
 */
export async function checkUnmappedBiomarkersWithAI(unmappedItems) {
  if (!unmappedItems || unmappedItems.length === 0) return [];

  const payload = {
    unmapped_items: unmappedItems,
    auto_persist: true,
  };

  // 1. Try local dev server API first
  try {
    const localRes = await fetch('/api/check-biomarker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (localRes.ok) {
      const data = await localRes.json();
      if (data?.success && data?.decisions) {
        return data.decisions;
      }
    }
  } catch {}

  // 2. Fall back to remote Supabase Edge Function
  try {
    const { data, error } = await supabase.functions.invoke('check-biomarker', {
      body: payload,
    });
    if (!error && data?.success && data?.decisions) {
      return data.decisions;
    }
    if (error) {
      console.warn('Edge Function check-biomarker invocation note:', error.message);
    }
  } catch (err) {
    console.warn('check-biomarker fallback note:', err);
  }

  return [];
}

/**
 * Calculates clinical trend direction by comparing current numeric value
 * against previous value and the biological reference range.
 */
function calculateTrendDirection(currentValue, previousValue, refMin, refMax) {
  if (previousValue === null || previousValue === undefined || isNaN(previousValue)) {
    return null;
  }

  const change = currentValue - previousValue;
  const pct = previousValue !== 0 ? (change / previousValue) * 100 : 0;

  // If no reference bounds available, use standard +/- 5% tolerance
  if (refMin === null && refMax === null) {
    return Math.abs(pct) < 5 ? 'stable' : (pct > 0 ? 'improving' : 'worsening');
  }

  const min = refMin ?? -Infinity;
  const max = refMax ?? Infinity;

  const currentIsNormal = currentValue >= min && currentValue <= max;
  const prevIsNormal = previousValue >= min && previousValue <= max;

  if (currentIsNormal) {
    return prevIsNormal ? 'stable' : 'improving';
  } else if (currentValue < min) {
    // Currently low: increasing towards min is improving, decreasing is worsening
    return change > 0 ? 'improving' : 'worsening';
  } else {
    // Currently high: decreasing towards max is improving, increasing is worsening
    return change < 0 ? 'improving' : 'worsening';
  }
}

/**
 * Option 2 Clinical Normalizer:
 * Cleans non-discriminating pathology noise words, formatting, and spelling variants
 * while strictly preserving diagnostic distinctions (Total vs Direct, etc.).
 */
export function sanitizeBiomarkerQuery(name) {
  if (!name || typeof name !== 'string') return '';
  let s = name.toLowerCase().trim();

  // 1. Common British vs American spelling variants in pathology
  s = s.replace(/\bhaem/g, 'hem');
  s = s.replace(/\bleuco/g, 'leuko');
  s = s.replace(/\bfoetal/g, 'fetal');
  s = s.replace(/\bglycosylated\b/g, 'glycated');

  // 2. Remove generic non-discriminating lab stop words & abbreviations
  // (Notice: we NEVER strip 'total', 'direct', 'indirect', 'fasting', 'free', etc.)
  s = s.replace(/\b(serum|s\.|plasma|whole blood|blood|estimation of|test for|level|levels|test|routine)\b/gi, ' ');

  // 3. Replace punctuation with spaces
  s = s.replace(/[:\/\-_(),.]/g, ' ');

  // 4. Collapse whitespace
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Reconciles an entire extracted lab report against the master biomarker database,
 * processes the unmapped queue with AI, and stores structured rows in test_results.
 * 
 * @param {Object} extraction - Full AI extraction result from extract-report
 * @param {Object} context - { userId, familyMemberId, documentId, reportDate, labName }
 * @returns {Promise<Object>} Reconciled result with database linkage details
 */
export async function reconcileReportBiomarkers(extraction, context = {}) {
  const {
    userId,
    familyMemberId,
    documentId,
    reportDate = new Date().toISOString().split('T')[0],
    labName = 'Diagnostic Lab'
  } = context;

  const reportData = extraction?.report_data;
  if (!reportData || !reportData.grouped_metrics || reportData.grouped_metrics.length === 0) {
    return { reconciled: false, reason: 'No grouped metrics found in report.' };
  }

  // 1. Flatten all tests from panels with direct references to metric objects
  const allTests = [];
  reportData.grouped_metrics.forEach((panel) => {
    (panel.metrics || []).forEach((metric) => {
      allTests.push({
        metricRef: metric,
        test_name: metric.test_name,
        value: metric.value,
        numeric_value: metric.numeric_value,
        unit: metric.unit,
        reference_range: metric.reference_range,
        panel_category: panel.category_name || 'Biochemistry',
      });
    });
  });

  if (allTests.length === 0) {
    return { reconciled: false, reason: 'Empty metrics array.' };
  }

  // 2. Batch query biomarkers_aliases with Option 2 (Raw + Sanitized Candidates)
  const candidateNames = new Set();
  allTests.forEach((t) => {
    const raw = t.test_name.trim().toLowerCase();
    const sanitized = sanitizeBiomarkerQuery(t.test_name);
    candidateNames.add(raw);
    if (sanitized && sanitized !== raw) {
      candidateNames.add(sanitized);
    }
  });

  const { data: matchedAliases, error: aliasError } = await supabase
    .from('biomarkers_aliases')
    .select(`
      alias_name,
      biomarker_id,
      biomarkers_mastertable (
        biomarker_id,
        standard_name,
        display_name,
        short_name,
        unit,
        min_value,
        max_value,
        category
      )
    `)
    .in('alias_name', Array.from(candidateNames));

  if (aliasError) {
    console.warn('Error querying biomarkers_aliases:', aliasError);
  }

  const aliasMap = new Map();
  (matchedAliases || []).forEach((row) => {
    aliasMap.set(row.alias_name.toLowerCase(), {
      biomarker_id: row.biomarker_id,
      master: row.biomarkers_mastertable,
    });
  });

  // 3. Divide into Bucket A (Matched) and Bucket B (Unmapped)
  const matchedBucket = [];
  const unmappedBucket = [];

  allTests.forEach((item) => {
    const raw = item.test_name.trim().toLowerCase();
    const sanitized = sanitizeBiomarkerQuery(item.test_name);

    const match = aliasMap.get(raw) || (sanitized ? aliasMap.get(sanitized) : null);

    if (match) {
      item.metricRef.biomarker_id = match.biomarker_id;
      item.metricRef.canonical_name = match.master?.display_name || match.master?.standard_name;
      item.metricRef.ref_min = match.master?.min_value ?? null;
      item.metricRef.ref_max = match.master?.max_value ?? null;

      matchedBucket.push({
        test: item.metricRef,
        biomarker_id: match.biomarker_id,
        master: match.master,
      });
    } else {
      unmappedBucket.push(item);
    }
  });

  // 4. Send Bucket B to the AI Lite Reviewer (check-biomarker)
  let aiDecisions = [];
  if (unmappedBucket.length > 0) {
    const batchSize = 25;
    for (let i = 0; i < unmappedBucket.length; i += batchSize) {
      const batch = unmappedBucket.slice(i, i + batchSize);
      const unmappedPayload = batch.map((item) => ({
        test_name: item.test_name,
        value: item.value,
        unit: item.unit || null,
        reference_range: item.reference_range || null,
      }));

      const batchDecisions = await checkUnmappedBiomarkersWithAI(unmappedPayload);
      if (Array.isArray(batchDecisions)) {
        aiDecisions = aiDecisions.concat(batchDecisions);
      }
    }

    // Process AI decisions
    aiDecisions.forEach((decision) => {
      const matchedUnmapped = unmappedBucket.find(
        (item) => item.test_name.trim().toLowerCase() === decision.original_test_name.trim().toLowerCase()
      );

      if (!matchedUnmapped) return;

      if (decision.action === 'DISCARD_JUNK') {
        matchedUnmapped.metricRef.is_junk = true;
        matchedUnmapped.metricRef.discard_reason = decision.reason || decision.discard_reason;
      } else if (decision.biomarker_id) {
        matchedUnmapped.metricRef.biomarker_id = decision.biomarker_id;
        matchedUnmapped.metricRef.canonical_name =
          decision.display_name || decision.standard_name || decision.matched_standard_name || matchedUnmapped.test_name;
        matchedUnmapped.metricRef.ref_min = decision.min_value ?? null;
        matchedUnmapped.metricRef.ref_max = decision.max_value ?? null;

        matchedBucket.push({
          test: matchedUnmapped.metricRef,
          biomarker_id: decision.biomarker_id,
          master: {
            biomarker_id: decision.biomarker_id,
            standard_name: decision.standard_name || decision.matched_standard_name || matchedUnmapped.test_name,
            display_name: decision.display_name || matchedUnmapped.test_name,
            unit: decision.unit || matchedUnmapped.unit,
            min_value: decision.min_value ?? null,
            max_value: decision.max_value ?? null,
            category: decision.category || matchedUnmapped.panel_category,
          },
        });
      }
    });

    // Remove discarded junk items from display panels
    reportData.grouped_metrics.forEach((panel) => {
      panel.metrics = (panel.metrics || []).filter((m) => !m.is_junk);
    });
  }

  // 5. Store / Link to lab_reports table with UUID validation
  let labReportId = null;
  const isUuid = (val) =>
    typeof val === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

  let targetUserId = isUuid(userId) ? userId : null;
  let targetFamilyMemberId = isUuid(familyMemberId) ? familyMemberId : null;
  let targetDocumentId = isUuid(documentId) ? documentId : null;

  if (!targetUserId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id && isUuid(session.user.id)) {
        targetUserId = session.user.id;
      }
    } catch {}
  }

  if (targetUserId && !targetFamilyMemberId) {
    try {
      const { data: members } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: true })
        .limit(1);
      if (members && members.length > 0) {
        targetFamilyMemberId = members[0].id;
      }
    } catch {}
  }

  if (targetUserId && targetFamilyMemberId && targetDocumentId) {
    try {
      const { data: existingReport } = await supabase
        .from('lab_reports')
        .select('id')
        .eq('document_id', targetDocumentId)
        .maybeSingle();

      if (existingReport) {
        labReportId = existingReport.id;
      } else {
        const { data: newReport, error: repError } = await supabase
          .from('lab_reports')
          .insert({
            user_id: targetUserId,
            family_member_id: targetFamilyMemberId,
            document_id: targetDocumentId,
            lab_name: reportData.lab_name || labName,
            report_date: reportDate,
            report_type: 'Lab Report',
            status: 'final',
            ai_summary: extraction.common_data?.summary || null,
          })
          .select('id')
          .single();

        if (!repError && newReport) {
          labReportId = newReport.id;
        }
      }
    } catch (e) {
      console.warn('lab_reports insert note (handled):', e);
    }
  }

  // 6. Save each matched test result to test_results table with trend calculation
  const savedTestResults = [];

  for (const matchItem of matchedBucket) {
    const { test, biomarker_id, master } = matchItem;
    const numVal = typeof test.numeric_value === 'number'
      ? test.numeric_value
      : parseFloat(String(test.value).replace(/[^0-9.-]/g, ''));

    const isNumeric = !isNaN(numVal);

    let previousValue = null;
    let changePercentage = null;
    let trend = null;

    if (isNumeric && targetFamilyMemberId) {
      try {
        const { data: prevRows } = await supabase
          .from('test_results')
          .select('value, ref_min, ref_max, report_date')
          .eq('family_member_id', targetFamilyMemberId)
          .eq('biomarker_id', biomarker_id)
          .lt('report_date', reportDate)
          .order('report_date', { ascending: false })
          .limit(1);

        if (prevRows && prevRows.length > 0) {
          const prevNum = parseFloat(prevRows[0].value);
          if (!isNaN(prevNum)) {
            previousValue = prevNum;
            const delta = numVal - prevNum;
            changePercentage = prevNum !== 0 ? Math.round((delta / prevNum) * 1000) / 10 : 0;
            trend = calculateTrendDirection(
              numVal,
              prevNum,
              master?.min_value ?? null,
              master?.max_value ?? null
            );
          }
        }
      } catch (prevErr) {
        console.warn('Error fetching previous test result:', prevErr);
      }
    }

    // Directly assign trend insights onto the metric object for UI views
    test.previous_value = previousValue;
    test.change_percentage = changePercentage;
    test.trend = trend;

    const status = test.severity || (test.is_abnormal ? 'high' : 'normal');

    if (targetUserId && labReportId) {
      try {
        const { data: insertedTest, error: testErr } = await supabase
          .from('test_results')
          .insert({
            user_id: targetUserId,
            lab_report_id: labReportId,
            family_member_id: targetFamilyMemberId,
            report_date: reportDate,
            test_name: test.test_name,
            value: String(test.value),
            unit: test.unit || master?.unit || null,
            ref_min: master?.min_value ?? null,
            ref_max: master?.max_value ?? null,
            ref_type: test.reference_range || null,
            status,
            biomarker_id,
            previous_value: previousValue,
            change_percentage: changePercentage,
            trend,
          })
          .select()
          .single();

        if (!testErr && insertedTest) {
          savedTestResults.push(insertedTest);
        }
      } catch (insertErr) {
        console.warn('test_results insert note (handled):', insertErr);
      }
    }
  }

  // 7. Update documents table in Supabase so extraction and status are persisted
  if (targetDocumentId) {
    try {
      await supabase
        .from('documents')
        .update({
          ai_analysis_status: 'completed',
          ai_analysis_result: extraction,
        })
        .eq('id', targetDocumentId);
    } catch (docUpdateErr) {
      console.warn('documents update note (handled):', docUpdateErr);
    }
  }

  return {
    reconciled: true,
    total_tests: allTests.length,
    matched_bucket_count: matchedBucket.length,
    unmapped_bucket_count: unmappedBucket.length,
    ai_decisions_count: aiDecisions.length,
    saved_test_results_count: savedTestResults.length,
    lab_report_id: labReportId,
  };
}
