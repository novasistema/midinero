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
