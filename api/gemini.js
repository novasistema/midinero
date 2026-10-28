// Vercel Serverless Function: /api/gemini.js
// Procesa solicitudes hacia la API de Gemini protegiendo la clave en el servidor
// y verificando que el usuario cuente con sesión válida y licencia activa en Supabase.

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  // Configuración de encabezados CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Utilizar POST.' });
  }

  // 1. Extraer y verificar el Bearer token de Supabase en Authorization
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autorización requerido en header Authorization: Bearer <token>' });
  }

  const token = authHeader.replace('Bearer ', '').trim();

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Variables de entorno de Supabase no configuradas en el servidor.' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  // 2. Validar sesión del usuario con Supabase
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'Sesión inválida o expirada en Supabase.' });
  }

  const userId = userData.user.id;

  // 3. Verificar que el usuario tenga acceso activo y vigente a 'midinero'
  const { data: accesos, error: accesosError } = await supabase
    .from('accesos')
    .select('*')
    .eq('user_id', userId)
    .eq('app_slug', 'midinero')
    .order('creado_el', { ascending: false });

  if (accesosError || !accesos || accesos.length === 0) {
    return res.status(403).json({ error: 'Acceso no autorizado: No cuentas con licencia para Mi Dinero.' });
  }

  const now = Date.now();
  const hasActiveAccess = accesos.some((acc) => {
    if (acc.estado !== 'activo') return false;
    if (!acc.vence_el) return true; // De por vida
    return new Date(acc.vence_el).getTime() > now;
  });

  if (!hasActiveAccess) {
    return res.status(403).json({ error: 'Acceso vencido o inactivo. Renueva tu licencia en https://verticelab.com.ar' });
  }

  // 4. Si el acceso es válido, invocar Gemini con GEMINI_API_KEY del entorno de servidor
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en las variables de servidor.' });
  }

  try {
    const { prompt, imageBase64 } = req.body || {};
    if (!prompt && !imageBase64) {
      return res.status(400).json({ error: 'Se requiere prompt o imageBase64 en el cuerpo de la petición.' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const systemInstruction = `Eres un asistente de finanzas personales para la app Mi Dinero de Vértice Lab.
Analiza el texto o ticket recibido y responde ÚNICAMENTE con un objeto JSON válido con los campos:
{
  "type": "ingreso" o "gasto",
  "amount": número flotante positivo,
  "categoryId": una de ["comida", "supermercado", "salud", "farmacia", "impuestos", "ocio", "transporte", "vivienda", "salario", "inversiones", "servicios", "otros"],
  "description": resumen breve del concepto,
  "paymentMethod": una de ["efectivo", "tarjeta", "transferencia", "bizum"],
  "notes": detalle adicional opcional
}`;

    const contents = [];
    if (imageBase64) {
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    }
    contents.push({
      text: prompt || 'Analiza el ticket adjunto y extrae los datos de la transacción en JSON.',
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const outputText = response.text || '{}';
    let parsedResult;
    try {
      parsedResult = JSON.parse(outputText);
    } catch {
      parsedResult = { raw: outputText };
    }

    return res.status(200).json({
      success: true,
      data: parsedResult,
    });
  } catch (error) {
    console.error('Error al procesar con Gemini:', error);
    return res.status(500).json({ error: error.message || 'Error al comunicarse con Gemini.' });
  }
}
