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
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wchaqrfkxnomafwcpiqq.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjaGFxcmZreG5vbWFmd2NwaXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MzgwMjgsImV4cCI6MjEwMjIxNDAyOH0.-8zwMTal6D2zbchuUEVOigebQVWBgZ7D94cARfxIyN8',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjaGFxcmZreG5vbWFmd2NwaXFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjYzODAyOCwiZXhwIjoyMTAyMjE0MDI4fQ.G0IIG8RHiBQO4IvhUa4QklvgqHPI8ejiAOHektcO7-4',
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
    instructorSecretCode: process.env.NEXT_PUBLIC_INSTRUCTOR_SECRET_CODE || 'TG-INSTRUCTOR-2026',
  },
};

export default envConfig;
