import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { generateClinicalAI } from '../_shared/gemini.ts';

const SYSTEM_PROMPT = `You are an elite, highly secure medical document classification AI working for a production healthcare platform. 
Your ONLY objective is to critically examine the provided document (which may contain multiple pages or images) and verify if it is a VALID PRESCRIPTION.

WHAT CONSTITUTES A VALID PRESCRIPTION:
- A doctor's handwritten or printed prescription pad.
- A hospital discharge summary containing a medication regimen.
- A clinical receipt or bill that explicitly lists medications prescribed.
- A medicine regimen sheet.

STRICT VERIFICATION RULES:
- Evaluate the document meticulously page-by-page.
- If a page is entirely unrelated to medical care (e.g., a photo of a dog, a car, a landscape, a random selfie, a driver's license), you MUST mark it as "invalid" and provide a brief reason.
- If a page is a "Blood Test" or "Laboratory Diagnostic Report" (e.g., CBC, lipid profile, metabolic panel with reference ranges), mark it as "invalid_category" and explain that it is a lab report, not a prescription.
- If a page is slightly blurry but still clearly a prescription, mark it as "valid".

OUTPUT FORMAT:
You must return a strict, clean JSON object with this exact schema (no markdown formatting, no backticks, just raw JSON):
{
  "isValidOverall": boolean, // true ONLY if EVERY single page is a valid prescription. false otherwise.
  "pages": [
    {
      "pageIndex": number, // 0-indexed page number
      "status": "valid" | "invalid" | "invalid_category",
      "reason": "Brief, user-friendly explanation (e.g., 'This page looks like a random photo.' or 'This is a lab report, not a prescription.' or 'Valid prescription found.')"
    }
  ]
}`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cloud_file_key, file_base64, mime_type } = await req.json();
    if (!cloud_file_key && !file_base64) {
      return new Response(JSON.stringify({ error: 'Missing cloud_file_key or file_base64' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const storagePath = cloud_file_key ? cloud_file_key.replace(/^medical-vault\//, '') : `upload_${Date.now()}.jpg`;
    let base64Data = file_base64;
    let resolvedMime = mime_type;

    if (!base64Data && cloud_file_key) {
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('medical-vault')
        .download(storagePath);

      if (downloadError || !fileData) {
        console.error('Supabase Download Error:', downloadError);
        return new Response(JSON.stringify({ error: 'Failed to download secure document from vault.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      resolvedMime = storagePath.toLowerCase().endsWith('.pdf') ? 'application/pdf' :
                     storagePath.toLowerCase().endsWith('.png') ? 'image/png' :
                     'image/jpeg';

      const arrayBuffer = await fileData.arrayBuffer();
      base64Data = encodeBase64(arrayBuffer);
    } else if (base64Data) {
      if (base64Data.includes(',')) {
        const parts = base64Data.split(',');
        if (!resolvedMime) {
          const match = parts[0].match(/data:(.*?);base64/);
          if (match) resolvedMime = match[1];
        }
        base64Data = parts[1];
      }
      if (!resolvedMime) resolvedMime = 'image/jpeg';
    }

    const candidateKeys = [
      Deno.env.get('GEMINI_API_KEY_PRESCRIPTION'),
      Deno.env.get('GEMINI_API_KEY_COMMON'),
      Deno.env.get('GEMINI_API_KEY_REPORT'),
    ].filter(Boolean) as string[];

    const analysis = await generateClinicalAI({
      prompt: SYSTEM_PROMPT,
      base64Data,
      mimeType: resolvedMime,
      candidateKeys,
    });

    return new Response(JSON.stringify({ success: true, analysis }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Check Prescription Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
