const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
];

export async function generateClinicalAI({
  prompt,
  base64Data,
  mimeType,
  candidateKeys,
}: {
  prompt: string;
  base64Data: string;
  mimeType: string;
  candidateKeys: string[];
}): Promise<any> {
  const validKeys = candidateKeys.filter((k) => !!k && k.trim().length > 0);
  if (validKeys.length === 0) {
    throw new Error('No valid Gemini API keys found in Edge Function environment.');
  }

  let lastError: any = null;

  for (const apiKey of validKeys) {
    for (const model of CANDIDATE_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.1,
            },
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          console.warn(`[Gemini] ${model} failed with HTTP ${response.status}: ${errBody.slice(0, 200)}`);
          lastError = new Error(`Gemini HTTP ${response.status}: ${errBody}`);
          continue;
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          console.warn(`[Gemini] ${model} returned empty candidate text.`);
          continue;
        }

        // Clean & parse JSON safely
        try {
          return JSON.parse(text);
        } catch {
          const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(cleaned);
        }
      } catch (err: any) {
        console.warn(`[Gemini] Error invoking ${model}:`, err.message);
        lastError = err;
      }
    }
  }

  throw lastError || new Error('All Gemini API model candidates failed.');
}
