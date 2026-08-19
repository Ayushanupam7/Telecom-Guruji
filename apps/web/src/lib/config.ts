/**
 * Centralized Application & API Environment Configuration
 * Consolidates all Supabase, AI Providers (Groq & Gemini), Payment, and App URLs
 * into a single unified source of truth for deployment (Vercel, Render, Docker, etc.).
 */

export const envConfig = {
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV !== 'production',
  },

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  ai: {
    groq: {
      apiKey: process.env.GROQ_API_KEY || '',
      defaultModel: process.env.GROQ_DEFAULT_MODEL || 'openai/gpt-oss-120b',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      defaultModel: process.env.GEMINI_DEFAULT_MODEL || 'gemini-1.5-flash',
    },
  },

  payments: {
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'signalhub_webhook_secret_key',
    providerSecretKey: process.env.PAYMENT_PROVIDER_SECRET_KEY || '',
  },

  security: {
    certificateSigningSecret: process.env.CERTIFICATE_SIGNING_SECRET || 'telecom_guruji_secure_cert_secret_2026',
  },
};

export default envConfig;
