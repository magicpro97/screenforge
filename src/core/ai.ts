import { generateTextSimple, type AIProviderType } from '@magicpro97/forge-core';
import { ASOMetadata, LocalizedMetadata, ScreenForgeConfig } from '../types/index.js';
import { loadConfig } from './config.js';

async function callAI(prompt: string, config: ScreenForgeConfig): Promise<string> {
  const provider = (config.aiProvider || 'gemini') as AIProviderType;
  const apiKey = config.apiKey;

  if (!apiKey) {
    throw new Error(
      `No API key configured. Run: screenforge config set apiKey <your-key>\n` +
      `Then set provider: screenforge config set aiProvider ${provider}`
    );
  }

  return generateTextSimple(provider, apiKey, prompt);
}

export async function generateMetadata(
  appName: string,
  appDescription: string,
  category?: string,
  angle?: string,
): Promise<ASOMetadata> {
  const config = await loadConfig();

  let prompt = `You are a world-class ASO copywriter who applies Cialdini's 6 principles of persuasion and the AIDA copywriting framework.

Generate optimized app store metadata following these SCIENTIFIC RULES:

TITLE (max 30 chars): Include primary keyword + benefit signal.
SUBTITLE (max 30 chars): Complement title with secondary benefit or social proof.

DESCRIPTION (max 4000 chars) — Follow this exact structure:
1. SOCIAL PROOF HOOK (line 1): Open with credibility — download count, rating, or award.
2. BENEFIT BULLETS (lines 2-6): Top 5 benefits (not features), each starting with an emoji. Frame as what the USER gains.
3. AUTHORITY SIGNALS (lines 7-8): Awards, press mentions, expert endorsements, or "Featured by Apple/Google".
4. SCARCITY/URGENCY CTA (last line): Mild urgency — "Download now" or "Join [X] users today".

KEYWORDS (up to 10): High-intent keywords matching user search behavior. Mix broad + long-tail.
SHORT DESCRIPTION (max 80 chars): Single compelling benefit statement.
PROMOTIONAL TEXT (max 170 chars): Time-sensitive or seasonal hook with social proof.

PSYCHOLOGICAL RULES:
- RECIPROCITY: Emphasize free value before asking for commitment
- CONSISTENCY: Use language that builds progressive engagement
- LIKING: Warm, conversational, emotionally resonant tone
- Never use manipulative or fake claims
- Benefits over features, always

App Name: ${appName}
Description: ${appDescription}
${category ? `Category: ${category}` : ''}
${angle ? `\nANGLE DIRECTIVE: ${angle}` : ''}

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
