/**
 * Shared Gemini API Client
 * Centralizes API calls, eliminates code duplication across routes
 * Uses header-based auth (not URL query string) for security
 */

export function extractMimeType(base64: string): string {
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('iVBOR')) return 'image/png';
  if (base64.startsWith('R0lGOD')) return 'image/gif';
  if (base64.startsWith('JVBOR')) return 'image/webp';
  return 'image/jpeg';
}

export function createImagePart(base64Data: string) {
  const cleanData = base64Data.startsWith('data:') ? base64Data.split(',')[1] : base64Data;
  const mimeType = base64Data.startsWith('data:')
    ? base64Data.match(/data:([^;]+);/)?.[1] || extractMimeType(cleanData)
    : extractMimeType(cleanData);
  return {
    inlineData: {
      mimeType,
      data: cleanData,
    },
  };
}

export function parseJSONResponse(content: string): any {
  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]); } catch { return null; }
    }
    return null;
  }
}

export interface GeminiCallOptions {
  images?: string[];
  prompt: string;
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
}

export async function callGemini(options: GeminiCallOptions): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key not configured');

  const {
    images = [],
    prompt,
    model = 'gemini-2.0-flash',
    maxOutputTokens = 4096,
    temperature = 0.1,
  } = options;

  const imageParts = images.map(img => createImagePart(img));

  // SECURITY: Use header auth instead of URL query parameter
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          ...imageParts,
          { text: prompt },
        ],
      }],
      generationConfig: {
        temperature,
        maxOutputTokens,
        responseMimeType: 'application/json',
      },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.message || `Gemini API error: ${response.status}`);
  }

  return await response.json();
}
