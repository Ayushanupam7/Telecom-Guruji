import { AIProviderType, AIProviderConfig, AIStrategyConfig, RichBlock } from '@signalhub/types';
import { supabaseAdmin } from '@/lib/supabase';
import { envConfig } from '@/lib/config';

// Default Fallback Keys & Models from Centralized Environment Configuration
const DEFAULT_GROQ_KEY = envConfig.ai.groq.apiKey;
const DEFAULT_GROQ_MODEL = envConfig.ai.groq.defaultModel;
const DEFAULT_GEMINI_KEY = envConfig.ai.gemini.apiKey;
const DEFAULT_GEMINI_MODEL = envConfig.ai.gemini.defaultModel;

export const GROQ_MODELS = [
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (Recommended Primary)', description: 'Fast, high reasoning for course generation & definitions' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B (Ultra Fast)', description: 'Ultra-fast low-latency text completion' },
  { id: 'qwen/qwen3.6-27b', name: 'Qwen 3.6 27B', description: 'Advanced multilingual model on Groq' },
  { id: 'allam-2-7b', name: 'Allam 2 7B', description: 'Fast lightweight model on Groq' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', description: 'Meta Llama model' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', description: 'Meta Llama 8B Instant' },
];

export const GEMINI_MODELS = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Recommended Fallback)', description: 'High speed, large context window' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Maximum reasoning & long documents' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Next-gen fast multimodal model' },
];

export interface AIResponse<T = string> {
  success: boolean;
  data: T;
  providerUsed: AIProviderType;
  fallbackUsed: boolean;
  model: string;
  error?: string;
}

/**
 * Fetch stored AI settings for a given user or global defaults.
 */
export async function getEffectiveAISettings(userId: string = 'global'): Promise<{
  groqConfig: AIProviderConfig;
  geminiConfig: AIProviderConfig;
  strategy: AIStrategyConfig;
}> {
  let groqKey = process.env.GROQ_API_KEY || DEFAULT_GROQ_KEY;
  let groqModel = process.env.GROQ_DEFAULT_MODEL || DEFAULT_GROQ_MODEL;
  let groqEnabled = true;

  let geminiKey = process.env.GEMINI_API_KEY || DEFAULT_GEMINI_KEY;
  let geminiModel = process.env.GEMINI_DEFAULT_MODEL || DEFAULT_GEMINI_MODEL;
  let geminiEnabled = true;

  let primaryProvider: AIProviderType = 'groq';
  let fallbackProvider: AIProviderType = 'gemini';

  try {
    const { data: dbSettings } = await supabaseAdmin
      .from('ai_provider_settings')
      .select('*')
      .or(`user_id.eq.${userId},user_id.eq.global`);

    if (dbSettings && dbSettings.length > 0) {
      for (const item of dbSettings) {
        if (item.provider === 'groq') {
          if (item.api_key) groqKey = item.api_key;
          if (item.model) {
            groqModel = item.model === 'llama-3.3-70b-versatile' ? 'openai/gpt-oss-120b' : item.model;
          }
          groqEnabled = item.is_enabled ?? true;
          if (item.is_primary) primaryProvider = 'groq';
        } else if (item.provider === 'gemini') {
          if (item.api_key) geminiKey = item.api_key;
          if (item.model) geminiModel = item.model;
          geminiEnabled = item.is_enabled ?? true;
          if (item.is_primary) primaryProvider = 'gemini';
        }
      }
      fallbackProvider = primaryProvider === 'groq' ? 'gemini' : 'groq';
    }
  } catch (err) {
    console.warn('Could not read ai_provider_settings from DB, using fallback defaults:', err);
  }

  const maskKey = (k: string) => {
    if (!k || k.length < 8) return '••••••••';
    return `••••••••${k.slice(-4)}`;
  };

  return {
    groqConfig: {
      provider: 'groq',
      api_key: groqKey,
      masked_key: maskKey(groqKey),
      model: groqModel,
      is_enabled: groqEnabled,
      is_primary: primaryProvider === 'groq',
      status: groqKey ? 'connected' : 'not_configured',
    },
    geminiConfig: {
      provider: 'gemini',
      api_key: geminiKey,
      masked_key: maskKey(geminiKey),
      model: geminiModel,
      is_enabled: geminiEnabled,
      is_primary: primaryProvider === 'gemini',
      status: geminiKey ? 'connected' : 'not_configured',
    },
    strategy: {
      primaryProvider,
      fallbackProvider,
      groqModel,
      geminiModel,
      temperature: 0.7,
      maxTokens: 4096,
    },
  };
}

/**
 * Call Groq API with automatic model fallback if a specific model returns 404/model_not_found.
 */
async function callGroqAPI(
  prompt: string, 
  systemPrompt?: string, 
  model: string = 'openai/gpt-oss-120b', 
  apiKey?: string
): Promise<{ content: string; modelUsed: string }> {
  const key = apiKey || DEFAULT_GROQ_KEY;
  if (!key) throw new Error('Groq API Key is not configured.');

  // Candidate models list in priority order
  const modelsToTry = [
    model,
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.6-27b',
    'allam-2-7b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant'
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  let lastError: any = null;

  for (const candidateModel of modelsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key.trim()}`,
        },
        body: JSON.stringify({
          model: candidateModel,
          messages,
          temperature: 0.6,
          max_tokens: 4096,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        // If model not found or 404, cascade to next active model
        if (res.status === 404 || errText.includes('model_not_found') || errText.includes('does not exist')) {
          lastError = new Error(`Groq API Error (${res.status}): ${errText || res.statusText}`);
          continue;
        }
        throw new Error(`Groq API Error (${res.status}): ${errText || res.statusText}`);
      }

      const data = await res.json();
      let content = data.choices?.[0]?.message?.content || '';
      // Strip internal <think> tags if generated
      content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      return { content, modelUsed: candidateModel };
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      if (err.name === 'AbortError') {
        throw new Error('Groq API timeout after 45 seconds');
      }
    }
  }

  throw lastError || new Error('All Groq models failed');
}

/**
 * Call Google Gemini API.
 */
async function callGeminiAPI(prompt: string, systemPrompt?: string, model: string = 'gemini-1.5-flash', apiKey?: string): Promise<string> {
  const key = apiKey || DEFAULT_GEMINI_KEY;
  if (!key) throw new Error('Google Gemini API Key is not configured.');

  const effectiveModel = model || 'gemini-1.5-flash';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    // Try OpenAI-compatible endpoint first, with fallback to Google REST generateContent
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key.trim()}`,
      },
      body: JSON.stringify({
        model: effectiveModel,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }

    // Fallback to direct REST endpoint
    const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${effectiveModel}:generateContent?key=${encodeURIComponent(key.trim())}`;
    const restRes = await fetch(restUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              ...(systemPrompt ? [{ text: `SYSTEM INSTRUCTION:\n${systemPrompt}\n\n` }] : []),
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!restRes.ok) {
      const errText = await restRes.text().catch(() => '');
      throw new Error(`Gemini API Error (${restRes.status}): ${errText || restRes.statusText}`);
    }

    const restData = await restRes.json();
    const candidate = restData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return candidate;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Execute AI Request with Automatic Provider Fallback (Groq -> Gemini or Gemini -> Groq).
 */
export async function executeAIWithFallback<T = string>(
  prompt: string,
  systemPrompt?: string,
  options?: {
    userId?: string;
    asJSON?: boolean;
    customGroqKey?: string;
    customGeminiKey?: string;
    overridePrimary?: AIProviderType;
  }
): Promise<AIResponse<T>> {
  const { groqConfig, geminiConfig, strategy } = await getEffectiveAISettings(options?.userId);

  const groqKey = options?.customGroqKey || groqConfig.api_key;
  const geminiKey = options?.customGeminiKey || geminiConfig.api_key;
  const primaryProvider = options?.overridePrimary || strategy.primaryProvider || 'groq';
  const fallbackProvider = primaryProvider === 'groq' ? 'gemini' : 'groq';

  let rawOutput = '';
  let providerUsed: AIProviderType = primaryProvider;
  let fallbackUsed = false;
  let usedModel = primaryProvider === 'groq' ? strategy.groqModel : strategy.geminiModel;

  // 1. Attempt Primary Provider
  try {
    if (primaryProvider === 'groq') {
      const groqRes = await callGroqAPI(prompt, systemPrompt, strategy.groqModel, groqKey);
      rawOutput = groqRes.content;
      usedModel = groqRes.modelUsed;
    } else {
      rawOutput = await callGeminiAPI(prompt, systemPrompt, strategy.geminiModel, geminiKey);
    }
  } catch (primaryError: any) {
    console.warn(`Primary AI Provider (${primaryProvider}) failed. Attempting fallback (${fallbackProvider})... Reason:`, primaryError.message);

    // 2. Attempt Fallback Provider
    try {
      if (fallbackProvider === 'groq') {
        const groqRes = await callGroqAPI(prompt, systemPrompt, strategy.groqModel, groqKey);
        rawOutput = groqRes.content;
        usedModel = groqRes.modelUsed;
        providerUsed = 'groq';
      } else {
        rawOutput = await callGeminiAPI(prompt, systemPrompt, strategy.geminiModel, geminiKey);
        providerUsed = 'gemini';
        usedModel = strategy.geminiModel;
      }
      fallbackUsed = true;
    } catch (fallbackError: any) {
      console.error(`Both AI Providers failed: Primary (${primaryProvider}): ${primaryError.message} | Fallback (${fallbackProvider}): ${fallbackError.message}`);
      throw new Error(`AI Generation Service Error: Unable to complete request using ${primaryProvider} or ${fallbackProvider}. Details: ${primaryError.message}`);
    }
  }

  // Parse JSON if requested
  if (options?.asJSON) {
    try {
      const cleanJson = extractJSONString(rawOutput);
      const parsed = JSON.parse(cleanJson) as T;
      return {
        success: true,
        data: parsed,
        providerUsed,
        fallbackUsed,
        model: usedModel,
      };
    } catch (jsonErr: any) {
      console.warn('JSON parsing failed on raw AI output, retrying extraction:', jsonErr.message);
      const fallbackParsed = tryLooseJsonParse(rawOutput) as T;
      return {
        success: true,
        data: fallbackParsed,
        providerUsed,
        fallbackUsed,
        model: usedModel,
      };
    }
  }

  return {
    success: true,
    data: rawOutput as unknown as T,
    providerUsed,
    fallbackUsed,
    model: usedModel,
  };
}

/**
 * Test connectivity for a specific provider.
 */
export async function testProviderConnection(
  provider: AIProviderType,
  apiKey?: string,
  model?: string
): Promise<{ success: boolean; message: string; model: string }> {
  const testPrompt = 'Respond with exactly one word: "OK"';
  const effectiveModel = model || (provider === 'groq' ? 'openai/gpt-oss-120b' : 'gemini-1.5-flash');

  try {
    let result = '';
    let usedModel = effectiveModel;
    if (provider === 'groq') {
      const groqRes = await callGroqAPI(testPrompt, undefined, effectiveModel, apiKey);
      result = groqRes.content;
      usedModel = groqRes.modelUsed;
    } else {
      result = await callGeminiAPI(testPrompt, undefined, effectiveModel, apiKey);
    }

    if (result && result.trim().length > 0) {
      return {
        success: true,
        message: `Successfully connected to ${provider.toUpperCase()} (${usedModel})!`,
        model: usedModel,
      };
    }
    return {
      success: false,
      message: `Empty response received from ${provider.toUpperCase()}`,
      model: usedModel,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `${provider.toUpperCase()} Connection Error: ${err.message || 'Unknown network error'}`,
      model: effectiveModel,
    };
  }
}

/**
 * Clean markdown code fences and extract JSON.
 */
function extractJSONString(text: string): string {
  let cleaned = text.trim();
  // Remove markdown code fences like ```json ... ``` or ``` ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  // Find first { or [ and last } or ]
  const firstCurly = cleaned.indexOf('{');
  const firstSquare = cleaned.indexOf('[');
  let startIdx = 0;

  if (firstCurly !== -1 && (firstSquare === -1 || firstCurly < firstSquare)) {
    startIdx = firstCurly;
    const lastCurly = cleaned.lastIndexOf('}');
    if (lastCurly !== -1) {
      cleaned = cleaned.substring(startIdx, lastCurly + 1);
    }
  } else if (firstSquare !== -1) {
    startIdx = firstSquare;
    const lastSquare = cleaned.lastIndexOf(']');
    if (lastSquare !== -1) {
      cleaned = cleaned.substring(startIdx, lastSquare + 1);
    }
  }
  return cleaned;
}

function tryLooseJsonParse(text: string): any {
  try {
    return JSON.parse(extractJSONString(text));
  } catch {
    return { textContent: text };
  }
}
