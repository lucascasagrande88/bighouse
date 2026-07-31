// Cliente de OpenAI. Corre sólo del lado del servidor: la API key nunca sale
// del entorno de Netlify y el frontend no la ve ni en un header.

const API = 'https://api.openai.com/v1';

export const MODELS = {
  get text() {
    return process.env.OPENAI_TEXT_MODEL || 'gpt-4.1';
  },
  get vision() {
    return process.env.OPENAI_VISION_MODEL || 'gpt-4.1';
  },
  get image() {
    return process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
  },
};

class OpenAIError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function call(path, payload, { timeout = 120000 } = {}) {
  const keyEnv = process.env.OPENAI_API_KEY;
  if (!keyEnv) throw new OpenAIError('OPENAI_API_KEY no está configurada.', 500);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${keyEnv}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
    if (!res.ok) {
      const msg = (body.error && body.error.message) || `OpenAI respondió ${res.status}`;
      throw new OpenAIError(msg, res.status, body);
    }
    return body;
  } catch (err) {
    if (err.name === 'AbortError') throw new OpenAIError('La llamada a OpenAI tardó demasiado.', 504);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Salida estructurada con JSON Schema estricto.
 *
 * Esto es lo que hace que el sistema sea confiable: el modelo no devuelve texto
 * que después hay que interpretar con expresiones regulares, devuelve un objeto
 * con las claves que el motor espera. Si no puede cumplir el schema, falla
 * ruidosamente en vez de entregar algo a medias.
 *
 * @param {object} o
 * @param {object} o.schema   El archivo de engine/schema/*.json (name + schema)
 * @param {string} o.system
 * @param {string} o.user
 * @param {string[]} [o.images]  data URLs o URLs de frames para análisis visual
 */
export async function structured({ schema, system, user, images = [], model, temperature = 0.7, timeout }) {
  const content = [{ type: 'text', text: user }];
  for (const url of images) {
    content.push({ type: 'image_url', image_url: { url, detail: 'low' } });
  }

  const body = await call(
    '/chat/completions',
    {
      model: model || (images.length ? MODELS.vision : MODELS.text),
      temperature,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: schema.name,
          strict: true,
          schema: schema.schema,
        },
      },
    },
    { timeout }
  );

  const choice = body.choices && body.choices[0];
  if (!choice) throw new OpenAIError('OpenAI no devolvió ninguna respuesta.', 502, body);
  if (choice.finish_reason === 'length') {
    throw new OpenAIError('La respuesta se cortó por límite de tokens. Probá con menos escenas.', 502, body);
  }
  const refusal = choice.message && choice.message.refusal;
  if (refusal) throw new OpenAIError(`El modelo rechazó el pedido: ${refusal}`, 422, body);

  try {
    return {
      data: JSON.parse(choice.message.content),
      usage: body.usage || null,
      model: body.model,
    };
  } catch {
    throw new OpenAIError('La respuesta no era JSON válido pese al schema estricto.', 502, body);
  }
}

/** Texto libre, para cosas que no necesitan estructura (un prompt de imagen). */
export async function plain({ system, user, model, temperature = 0.8, maxTokens = 700 }) {
  const body = await call('/chat/completions', {
    model: model || MODELS.text,
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  const choice = body.choices && body.choices[0];
  return { text: (choice && choice.message && choice.message.content) || '', usage: body.usage || null };
}

export { OpenAIError };
