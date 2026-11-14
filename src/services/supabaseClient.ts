import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://gtuzlggzcmfnvgiwnhhm.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_jaiUFjAP6aRiGVGEhJOowQ_K5KGUJxC';

export const SUPABASE_URL: string =
  import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;

export const SUPABASE_ANON_KEY: string =
  import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured: boolean = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY
);

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

function matriculeToEmail(matricule: string): string {
  const clean = matricule.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return `${clean}@upgc.ci`;
}

export async function syncSupabaseSignUp(params: {
  matricule: string;
  password: string;
  displayName: string;
  campus?: string;
  phone?: string;
}): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const email = matriculeToEmail(params.matricule);
    const { error } = await supabase.auth.signUp({
      email,
      password: params.password,
      options: {
        data: {
          matricule: params.matricule.trim().toUpperCase(),
          display_name: params.displayName,
          campus: params.campus || 'Campus UPGC Korhogo',
          phone: params.phone || null,
          role: 'student',
        },
      },
    });
    if (error) {
      console.warn('Supabase Auth signUp note:', error.message);
    }
  } catch (err) {
    console.warn('Supabase Auth signUp skipped:', err);
  }
}

export async function syncSupabaseSignIn(params: {
  matricule: string;
  password: string;
  displayName?: string;
  campus?: string;
  phone?: string;
}): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const email = matriculeToEmail(params.matricule);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: params.password,
    });
    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        await syncSupabaseSignUp({
          matricule: params.matricule,
          password: params.password,
          displayName: params.displayName || params.matricule,
          campus: params.campus,
          phone: params.phone,
        });
      } else {
        console.warn('Supabase Auth signIn note:', error.message);
      }
    }
  } catch (err) {
    console.warn('Supabase Auth signIn skipped:', err);
  }
}

export async function signOutSupabase(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase Auth signOut note:', err);
  }
}
