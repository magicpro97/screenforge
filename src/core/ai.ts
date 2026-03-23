import { ASOMetadata, LocalizedMetadata, ScreenForgeConfig } from '../types/index.js';
import { loadConfig } from './config.js';

async function callAI(prompt: string, config: ScreenForgeConfig): Promise<string> {
  const provider = config.aiProvider || 'gemini';
  const apiKey = config.apiKey;

  if (!apiKey) {
    throw new Error(
      `No API key configured. Run: screenforge config set apiKey <your-key>\n` +
      `Then set provider: screenforge config set aiProvider ${provider}`
    );
  }

  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } else if (provider === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || '';
  }

  throw new Error(`Unknown AI provider: ${provider}`);
}

export async function generateMetadata(
  appName: string,
  appDescription: string,
  category?: string,
): Promise<ASOMetadata> {
  const config = await loadConfig();

  const prompt = `You are an ASO (App Store Optimization) expert. Generate optimized app store metadata for the following app.

App Name: ${appName}
Description: ${appDescription}
${category ? `Category: ${category}` : ''}

Return ONLY valid JSON (no markdown, no code blocks) with these fields:
{
  "title": "optimized app title (max 30 chars)",
  "subtitle": "compelling subtitle (max 30 chars)",
  "description": "full app store description with features and benefits (max 4000 chars)",
  "keywords": ["keyword1", "keyword2", ...up to 10 keywords],
  "shortDescription": "Google Play short description (max 80 chars)",
  "promotionalText": "promotional text for featuring (max 170 chars)"
}`;

  const response = await callAI(prompt, config);

  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as ASOMetadata;
  } catch {
    const truncated = response.length > 200 ? response.slice(0, 200) + '...' : response;
    throw new Error(`Failed to parse AI response as JSON. Raw response:\n${truncated}`);
  }
}

export async function translateMetadata(
  metadata: ASOMetadata,
  targetLocale: string,
): Promise<LocalizedMetadata> {
  const config = await loadConfig();

  const prompt = `Translate the following app store metadata to ${targetLocale}. Maintain ASO optimization for the target locale.

Original metadata:
${JSON.stringify(metadata, null, 2)}

Return ONLY valid JSON (no markdown, no code blocks) with these fields:
{
  "title": "translated title",
  "subtitle": "translated subtitle",
  "description": "translated description",
  "keywords": ["translated", "keywords"],
  "shortDescription": "translated short description",
  "promotionalText": "translated promotional text"
}`;

  const response = await callAI(prompt, config);

  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const translated = JSON.parse(cleaned) as ASOMetadata;
    return { locale: targetLocale, metadata: translated };
  } catch {
    const truncated = response.length > 200 ? response.slice(0, 200) + '...' : response;
    throw new Error(`Failed to parse AI response as JSON. Raw response:\n${truncated}`);
  }
}
