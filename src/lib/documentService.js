import { supabase } from './supabaseClient';

/**
 * Generates a secure, unique cross-device sync session ID.
 */
export const generateSyncSessionId = () => {
  return `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
  aiAnalysisStatus = 'completed',
  localFilePath = null,
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
    ai_analysis_status: aiAnalysisStatus,
    local_file_path: localFilePath,
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

  return data;
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
