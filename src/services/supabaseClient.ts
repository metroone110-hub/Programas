import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

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

export function translateSupabaseAuthError(rawMessage?: string): string {
  const msg = (rawMessage || '').toLowerCase();
  if (!msg) return 'Une erreur est survenue avec Supabase Auth.';
  if (msg.includes('invalid login credentials')) {
    return 'E-mail ou mot de passe incorrect.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Votre adresse e-mail n\'est pas encore confirmée. Vérifiez votre boîte mail ou renvoyez le lien.';
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'Un compte existe déjà avec cette adresse e-mail. Connectez-vous dans l\'onglet Connexion.';
  }
  if (msg.includes('password should be at least')) {
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  }
  if (msg.includes('unable to validate email address') || msg.includes('invalid email')) {
    return 'Veuillez saisir une adresse e-mail valide.';
  }
  if (msg.includes('email rate limit exceeded') || msg.includes('over_email_send_rate_limit') || msg.includes('rate limit')) {
    return 'Trop de tentatives e-mail en peu de temps. Veuillez patienter quelques instants.';
  }
  if (msg.includes('signup is disabled')) {
    return 'Les inscriptions sont temporairement désactivées sur Supabase.';
  }
  return rawMessage || 'Erreur d\'authentification Supabase.';
}

export interface SupabaseEmailAuthResult {
  success: boolean;
  user?: User | null;
  session?: Session | null;
  needsEmailConfirmation?: boolean;
  error?: string;
}

export async function signUpWithSupabaseEmail(params: {
  email: string;
  password: string;
  displayName: string;
  matricule?: string;
  campus?: string;
  phone?: string;
}): Promise<SupabaseEmailAuthResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Configuration Supabase manquante.' };
  }
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanMatricule = params.matricule ? params.matricule.trim().toUpperCase() : undefined;
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: params.password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        display_name: params.displayName.trim(),
        matricule: cleanMatricule || null,
        campus: params.campus || 'Campus UPGC Korhogo',
        phone: params.phone || null,
        role: 'student',
        auth_provider: 'supabase_email',
      },
    },
  });

  if (error) {
    return {
      success: false,
      error: translateSupabaseAuthError(error.message),
    };
  }

  // Supabase returns user with identities=[] when email is already registered (if enumeration protection is on)
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return {
      success: false,
      error: 'Un compte existe déjà avec cette adresse e-mail. Essayez de vous connecter.',
    };
  }

  const needsConfirmation = Boolean(data.user && !data.session);
  return {
    success: true,
    user: data.user,
    session: data.session,
    needsEmailConfirmation: needsConfirmation,
  };
}

export async function signInWithSupabaseEmail(params: {
  email: string;
  password: string;
}): Promise<SupabaseEmailAuthResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Configuration Supabase manquante.' };
  }
  const cleanEmail = params.email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: params.password,
  });

  if (error) {
    const isUnconfirmed = error.message.toLowerCase().includes('email not confirmed');
    return {
      success: false,
      needsEmailConfirmation: isUnconfirmed,
      error: translateSupabaseAuthError(error.message),
    };
  }

  return {
    success: true,
    user: data.user,
    session: data.session,
    needsEmailConfirmation: false,
  };
}

export async function resendSupabaseConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Configuration Supabase manquante.' };
  }
  const cleanEmail = email.trim().toLowerCase();
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: cleanEmail,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) {
    return { success: false, error: translateSupabaseAuthError(error.message) };
  }
  return { success: true };
}

export async function sendSupabasePasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Configuration Supabase manquante.' };
  }
  const cleanEmail = email.trim().toLowerCase();
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: redirectUrl,
  });

  if (error) {
    return { success: false, error: translateSupabaseAuthError(error.message) };
  }
  return { success: true };
}

export async function updateSupabasePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Configuration Supabase manquante.' };
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { success: false, error: translateSupabaseAuthError(error.message) };
  }
  return { success: true };
}

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
          auth_provider: 'matricule',
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
