import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl !== 'https://tu-proyecto.supabase.co' &&
    supabaseAnonKey !== 'tu-anon-key'
  );
};

// Safe fallback client instance
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export interface UserAccessResult {
  hasAccess: boolean;
  reason?: 'no_record' | 'expired' | 'inactive' | 'error' | 'not_configured';
  expiresAt?: string | null;
  message?: string;
}

export const APP_SLUG = 'midinero';

/**
 * Verifica si el usuario actual tiene acceso activo y vigente para 'midinero' en la tabla 'accesos'
 */
export async function verifyUserAccess(userId: string): Promise<UserAccessResult> {
  if (!isSupabaseConfigured()) {
    return {
      hasAccess: false,
      reason: 'not_configured',
      message: 'Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en las variables de entorno.',
    };
  }

  try {
    const { data, error } = await supabase
      .from('accesos')
      .select('id, user_id, app_slug, estado, vence_el, creado_el')
      .eq('user_id', userId)
      .eq('app_slug', APP_SLUG)
      .order('creado_el', { ascending: false });

    if (error) {
      console.error('Error al consultar accesos en Supabase:', error);
      return {
        hasAccess: false,
        reason: 'error',
        message: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        hasAccess: false,
        reason: 'no_record',
        message: 'No existe una licencia asociada a este usuario.',
      };
    }

    // Buscar si tiene al menos un acceso activo y no vencido
    const now = new Date().getTime();
    for (const record of data) {
      if (record.estado === 'activo') {
        if (!record.vence_el) {
          // Acceso de por vida
          return { hasAccess: true, expiresAt: null };
        }

        const expiryTime = new Date(record.vence_el).getTime();
        if (expiryTime > now) {
          return { hasAccess: true, expiresAt: record.vence_el };
        }
      }
    }

    // Si tiene registros pero están vencidos o inactivos
    const hasExpired = data.some((r) => r.vence_el && new Date(r.vence_el).getTime() <= now);
    return {
      hasAccess: false,
      reason: hasExpired ? 'expired' : 'inactive',
      message: hasExpired ? 'Tu suscripción ha vencido.' : 'Tu acceso se encuentra inactivo.',
    };
  } catch (err: any) {
    console.error('Excepción al verificar acceso:', err);
    return {
      hasAccess: false,
      reason: 'error',
      message: err?.message || 'Error inesperado al verificar licencia.',
    };
  }
}

/**
 * Cierra las otras sesiones activas del usuario en otros navegadores o dispositivos
 */
export async function closeOtherSessions() {
  try {
    await supabase.auth.signOut({ scope: 'others' });
  } catch (err) {
    console.warn('No se pudieron cerrar otras sesiones:', err);
  }
}

/**
 * Marca que el usuario salió a Google para loguearse, así al volver
 * cerramos las otras sesiones (misma regla que con email y contraseña).
 */
export const OAUTH_PENDING_KEY = 'midinero_oauth_pending';
export const LOGIN_NOTICE_KEY = 'midinero_login_notice';

export async function signInWithGoogle() {
  try {
    sessionStorage.setItem(OAUTH_PENDING_KEY, '1');
  } catch {}
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: { prompt: 'select_account' },
    },
  });
}

/**
 * Lee (y limpia de la URL) el error que devuelve Supabase cuando el login con Google falla.
 * Con el registro público desactivado, una cuenta de Google que no existe en Auth vuelve
 * con error_description = "Signups not allowed for this instance".
 */
export function consumeOAuthErrorFromUrl(): string | null {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const error = search.get('error') || hash.get('error');
  if (!error) return null;
  const description = search.get('error_description') || hash.get('error_description') || '';

  try {
    window.history.replaceState(null, '', window.location.pathname);
  } catch {}

  if (/signup/i.test(description) || /not allowed/i.test(description)) {
    return 'Esa cuenta de Google no tiene acceso a Mi Dinero. Entrá con el mismo email con el que compraste tu licencia, o adquirí tu acceso en verticelab.com.ar.';
  }
  return description
    ? `No se pudo iniciar sesión con Google: ${description}`
    : 'No se pudo iniciar sesión con Google. Probá de nuevo.';
}

/** Devuelve true si el usuario entró con Google y no tiene otra forma de login. */
export function isGoogleOnlyUser(user: User): boolean {
  const providers = (user.identities || []).map((i) => i.provider);
  return providers.length > 0 && providers.every((p) => p === 'google');
}
