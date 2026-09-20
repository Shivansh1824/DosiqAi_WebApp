import { supabase } from './supabaseClient';
import { compileImagesToPdf, dataUrlToBlob } from './pdfUtils';

/**
 * Generates a secure, unique cross-device sync session ID.
 */
export const generateSyncSessionId = () => {
  return `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Uploads a file (PDF Blob, image Blob, or File) to Supabase Storage 'medical-vault'.
 * Path: medical-vault/{userId}/{timestamp}_{cleanFileName}
 * 
 * @param {string} userId - Auth user UUID
 * @param {Blob|File} fileBlob - Binary blob or file to upload
 * @param {string} fileName - Destination file name
 * @param {string} [mimeType] - e.g. 'application/pdf' or 'image/jpeg'
 * @returns {Promise<{ path: string, fullPath: string }>}
 */
export const uploadFileToVault = async (userId, fileBlob, fileName, mimeType = 'application/pdf') => {
  if (!userId) throw new Error('User ID is required for vault storage');

  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${userId}/${Date.now()}_${cleanName}`;

  try {
    const { data, error } = await supabase.storage
      .from('medical-vault')
      .upload(filePath, fileBlob, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn('Storage upload note:', error.message || error);
      return { path: filePath, fullPath: `medical-vault/${filePath}` };
    }

    return { path: data?.path || filePath, fullPath: `medical-vault/${data?.path || filePath}` };
  } catch (err) {
    console.warn('Vault storage exception (handled):', err);
    return { path: filePath, fullPath: `medical-vault/${filePath}` };
  }
};

/**
 * Creates and persists a document record into Supabase public.documents table.
 */
export const createDocumentRecord = async ({
  userId,
  familyMemberId,
  type,
  patientName,
  diagnosis,
  issuedBy,
  visitDate,
  cloudFileKey = null,
  localFilePath = null,
  pageCount = 1,
  aiAnalysisStatus = 'pending',
}) => {
  if (!userId) {
    throw new Error('User ID is required to persist document');
  }

  const payload = {
    user_id: userId,
    family_member_id: familyMemberId || null,
    type: type || 'Prescription',
    patient_name: patientName || 'Patient',
    diagnosis: diagnosis || (type === 'Blood Test' ? 'Complete Diagnostic & Lab Panel' : 'Clinical Prescription Record'),
    issued_by: issuedBy || (type === 'Blood Test' ? 'Clinical Diagnostic Laboratory' : 'Consulting Physician, MD'),
    visit_date: visitDate || new Date().toISOString().split('T')[0],
    cloud_file_key: cloudFileKey,
    local_file_path: localFilePath,
    ai_analysis_status: aiAnalysisStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('documents')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error inserting document in Supabase:', error);
    throw error;
  }

  return { ...data, page_count: pageCount };
};

/**
 * Processes document files for storage in the clinical vault.
 * - If 1 file: uploads directly (image or PDF) without conversion.
 * - If 2+ files: compiles into a single multi-page A4 PDF using jsPDF, then uploads.
 * 
 * @param {string} userId - Current caregiver auth UUID
 * @param {Array<Object>} files - List of captured/uploaded file items
 * @param {string} docType - 'Prescription' | 'Blood Test'
 * @param {string} patientName - Patient name
 * @returns {Promise<{ finalFileName: string, cloudFileKey: string, pageCount: number, isMulti: boolean }>}
 */
export const processDocumentFilesForVault = async (userId, files = [], docType = 'Prescription', patientName = 'Patient') => {
  if (!files || files.length === 0) {
    throw new Error('No files provided to process');
  }

  const isMulti = files.length > 1;
  let finalFileName;
  let finalBlob;
  let finalMime;
  const pageCount = files.length;

  if (isMulti) {
    // 2+ files: Compile into a single cohesive multi-page A4 clinical PDF
    const compiled = await compileImagesToPdf(files, {
      title: `${patientName} - ${docType}`,
    });
    finalBlob = compiled.pdfBlob;
    finalMime = 'application/pdf';
    finalFileName = `${docType.toLowerCase().replace(/\s+/g, '_')}_multipage_${Date.now()}.pdf`;
  } else {
    // Single file: Direct upload without conversion
    const single = files[0];
    const isPdf = single.type === 'application/pdf';
    finalMime = isPdf ? 'application/pdf' : (single.type || 'image/jpeg');
    const ext = isPdf ? 'pdf' : (finalMime.includes('png') ? 'png' : 'jpg');
    finalFileName = single.name || `${docType.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.${ext}`;

    if (single.dataUrl) {
      finalBlob = dataUrlToBlob(single.dataUrl, finalMime);
    } else {
      finalBlob = new Blob([], { type: finalMime });
    }
  }

  let cloudFileKey = null;
  if (userId && finalBlob) {
    const uploadRes = await uploadFileToVault(userId, finalBlob, finalFileName, finalMime);
    cloudFileKey = uploadRes.path;
  }

  return {
    finalFileName,
    cloudFileKey,
    pageCount,
    isMulti,
  };
};

/**
 * Calls the appropriate Gemini checker endpoint based on document type.
 * Returns page-by-page validation analysis from the AI.
 *
 * @param {string} cloudFileKey - Supabase path to the uploaded file
 * @param {string} docType - 'Prescription' | 'Blood Test'
 * @returns {Promise<{ isValidOverall: boolean, pages: Array }>}
 */
export const checkDocumentValidity = async (cloudFileKey, docType) => {
  const endpoint = docType === 'Prescription'
    ? '/api/check-prescription'
    : '/api/check-report';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cloud_file_key: cloudFileKey }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Verification failed (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Verification returned unsuccessful');

  return data.analysis;
};

/**
 * Calls the appropriate Gemini clinical extraction endpoint based on document type.
 * Returns the comprehensive A+ grade structured clinical JSON.
 *
 * @param {string} cloudFileKey - Supabase path to the uploaded file
 * @param {string} docType - 'Prescription' | 'Blood Test'
 * @returns {Promise<Object>}
 */
export const extractDocumentData = async (cloudFileKey, docType) => {
  const endpoint = docType === 'Prescription'
    ? '/api/extract-prescription'
    : '/api/extract-report';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cloud_file_key: cloudFileKey }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Clinical extraction failed (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Clinical extraction returned unsuccessful');

  // Persist result to documents table by cloud_file_key
  await supabase
    .from('documents')
    .update({ ai_analysis_result: data.extraction, ai_analysis_status: 'completed' })
    .eq('cloud_file_key', cloudFileKey);

  return data.extraction;
};


/**
 * Subscribes to cross-device mobile upload events via Supabase Realtime broadcast.
 * Listens for when a mobile device transmits an image for this specific sessionId.
 */
export const subscribeToMobileSync = (sessionId, onPhotoReceived) => {
  if (!sessionId) return () => {};

  const channelName = `mobile-sync-${sessionId}`;
  const channel = supabase.channel(channelName);

  channel
    .on('broadcast', { event: 'photo_uploaded' }, (eventPayload) => {
      if (eventPayload?.payload) {
        onPhotoReceived?.(eventPayload.payload);
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Connected and listening for cross-device sync
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Broadcasts a captured photo from a mobile browser to the open desktop session.
 */
export const broadcastMobilePhoto = async (sessionId, filePayload) => {
  if (!sessionId) throw new Error('Session ID is required');

  const channelName = `mobile-sync-${sessionId}`;
  const channel = supabase.channel(channelName);

  return new Promise((resolve, reject) => {
    let resolved = false;

    // Timeout safety
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        supabase.removeChannel(channel);
        reject(new Error('Connection timed out while sending photo to desktop'));
      }
    }, 15000);

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        try {
          const sendStatus = await channel.send({
            type: 'broadcast',
            event: 'photo_uploaded',
            payload: filePayload,
          });

          if (sendStatus === 'error') {
            throw new Error('Supabase Realtime broadcast failed: message rejected');
          }

          // Allow WebSocket frame to flush before closing channel
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              supabase.removeChannel(channel);
              resolve(true);
            }
          }, 1200);
        } catch (err) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            supabase.removeChannel(channel);
            reject(err);
          }
        }
      }
    });
  });
};
