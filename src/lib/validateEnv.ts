const REQUIRED_SUPABASE_PROJECT_REF = 'fkpwibismkewrezgchbq';
const REQUIRED_SUPABASE_URL = `https://${REQUIRED_SUPABASE_PROJECT_REF}.supabase.co`;

export function validateEnvironment(): void {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing required environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
    );
  }

  if (supabaseUrl !== REQUIRED_SUPABASE_URL) {
    throw new Error(
      `Invalid Supabase configuration detected.\n\n` +
      `This application is configured to work ONLY with the Supabase project: ${REQUIRED_SUPABASE_PROJECT_REF}\n\n` +
      `Expected URL: ${REQUIRED_SUPABASE_URL}\n` +
      `Received URL: ${supabaseUrl}\n\n` +
      `Please do not modify the .env file. This application is locked to a specific Supabase instance.`
    );
  }

  try {
    const payload = JSON.parse(atob(supabaseKey.split('.')[1]));

    if (payload.ref !== REQUIRED_SUPABASE_PROJECT_REF) {
      throw new Error(
        `Invalid Supabase key detected.\n\n` +
        `The provided key belongs to project: ${payload.ref}\n` +
        `But this application requires project: ${REQUIRED_SUPABASE_PROJECT_REF}\n\n` +
        `Please do not modify the .env file. This application is locked to a specific Supabase instance.`
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('Invalid Supabase key')) {
      throw e;
    }
    throw new Error(
      'Invalid Supabase key format. The key appears to be corrupted or invalid.'
    );
  }
}
