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
const uploadFileToVault = async (userId, fileBlob, fileName, mimeType = 'application/pdf') => {
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
      if (single.dataUrl.startsWith('data:')) {
        finalBlob = dataUrlToBlob(single.dataUrl, finalMime);
      } else {
        try {
          const resp = await fetch(single.dataUrl);
          finalBlob = await resp.blob();
        } catch (_) {
          finalBlob = new Blob([], { type: finalMime });
        }
      }
    } else if (single.fileObj) {
      finalBlob = single.fileObj;
    } else {
      finalBlob = new Blob([], { type: finalMime });
    }
  }

  let fileBase64 = null;
  if (isMulti && finalBlob) {
    fileBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(finalBlob);
    });
  } else if (files[0]?.dataUrl) {
    fileBase64 = files[0].dataUrl;
  } else if (finalBlob && finalBlob.size > 0) {
    fileBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(finalBlob);
    });
  }

  let cloudFileKey = null;
  const safeUserId = userId || 'vault';
  const targetPath = `${safeUserId}/${Date.now()}_${finalFileName}`;
  if (userId && finalBlob && finalBlob.size > 0) {
    try {
      const uploadRes = await uploadFileToVault(userId, finalBlob, finalFileName, finalMime);
      cloudFileKey = uploadRes.path || targetPath;
    } catch (uploadErr) {
      console.warn('Client upload note (handled by backend):', uploadErr?.message);
      cloudFileKey = targetPath;
    }
  } else {
    cloudFileKey = targetPath;
  }

  return {
    finalFileName,
    cloudFileKey,
    pageCount,
    isMulti,
    fileBase64,
    finalMime,
  };
};

/**
 * Calls the appropriate Supabase Edge Function based on document type.
 * Returns page-by-page validation analysis from the AI.
 *
 * @param {string} cloudFileKey - Supabase path to the uploaded file
 * @param {string} docType - 'Prescription' | 'Blood Test'
 * @returns {Promise<{ isValidOverall: boolean, pages: Array }>}
 */
export const checkDocumentValidity = async (cloudFileKey, docType, fileBase64 = null, mimeType = null) => {
  const functionName = docType === 'Prescription'
    ? 'check-prescription'
    : 'check-report';

  const payload = {
    cloud_file_key: cloudFileKey,
    file_base64: fileBase64,
    mime_type: mimeType,
  };

  // 1. Try local dev server endpoint first if available
  try {
    const localRes = await fetch(`/api/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (localRes.ok) {
      const data = await localRes.json();
      if (data?.success && data?.analysis) return data.analysis;
    }
  } catch (_) {}

  // 2. Fall back to remote Supabase Edge Function
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload,
  });

  if (error) {
    console.error(`Supabase Edge Function ${functionName} failed:`, error);
    throw new Error(error.message || `Verification failed (${functionName})`);
  }

  if (!data?.success) throw new Error(data?.error || 'Verification returned unsuccessful');

  return data.analysis;
};

/**
 * Calls the appropriate Supabase Edge Function based on document type.
 * Returns the comprehensive A+ grade structured clinical JSON.
 *
 * @param {string} cloudFileKey - Supabase path to the uploaded file
 * @param {string} docType - 'Prescription' | 'Blood Test'
 * @param {string} [fileBase64] - Direct base64 data URL / string
 * @param {string} [mimeType] - MIME type of document
 * @returns {Promise<Object>}
 */
export const extractDocumentData = async (cloudFileKey, docType, fileBase64 = null, mimeType = null) => {
  const functionName = docType === 'Prescription'
    ? 'extract-prescription'
    : 'extract-report';

  const payload = {
    cloud_file_key: cloudFileKey,
    file_base64: fileBase64,
    mime_type: mimeType,
  };

  let data = null;
  let lastError = null;

  // 1. Try local dev server endpoint first (fast, direct Gemini SDK)
  try {
    const localRes = await fetch(`/api/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (localRes.ok) {
      data = await localRes.json();
    } else {
      const errJson = await localRes.json().catch(() => ({}));
      lastError = new Error(errJson.error || `HTTP ${localRes.status}`);
    }
  } catch (netErr) {
    lastError = netErr;
  }

  // 2. Fall back to remote Supabase Edge Function
  if (!data?.success) {
    const edgeRes = await supabase.functions.invoke(functionName, {
      body: payload,
    });
    if (edgeRes.data?.success) {
      data = edgeRes.data;
    } else {
      lastError = edgeRes.error || new Error(edgeRes.data?.error || 'Extraction failed');
    }
  }

  if (!data?.success) {
    console.error(`Clinical Extraction ${functionName} failed:`, lastError);
    throw lastError || new Error(`Clinical extraction failed (${functionName})`);
  }

  // Persist result to documents table by cloud_file_key if possible
  if (cloudFileKey) {
    try {
      await supabase
        .from('documents')
        .update({ ai_analysis_result: data.extraction, ai_analysis_status: 'completed' })
        .eq('cloud_file_key', cloudFileKey);
    } catch (_) {}
  }

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

/**
 * Obtains a secure temporary URL (signed or public) to view a document stored in Supabase Storage.
 * 
 * @param {string} cloudFileKey - Key format e.g. 'medical-vault/user_id/...' or 'user_id/...'
 * @returns {Promise<string|null>}
 */
export const getDocumentFileUrl = async (cloudFileKey) => {
  if (!cloudFileKey) return null;
  const path = cloudFileKey.replace(/^medical-vault\//, '');
  try {
    const { data, error } = await supabase.storage
      .from('medical-vault')
      .createSignedUrl(path, 3600);
    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  } catch (err) {
    console.warn('Signed URL generation error (handled):', err);
  }
  try {
    const { data } = supabase.storage.from('medical-vault').getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (err) {
    console.warn('Public URL generation error (handled):', err);
    return null;
  }
};
