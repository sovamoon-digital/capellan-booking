// Claude (Anthropic Messages API) — generates a Spanish "word of wisdom"
// for Capellán: a short hook (rendered on the image) + caption + hashtags.
//
// Raw fetch integration (no SDK in this project). Defaults to claude-opus-4-8.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';

export interface Wisdom {
  hook: string;
  caption: string;
  hashtags: string[];
}

export async function generateWisdom(
  recent: { excerpt?: string }[]
): Promise<Wisdom> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY no configurada');

  // No-repeat rule: show Claude recent post openings so it varies topic/angle.
  let avoid = '';
  const items = recent
    .map((r) => (r.excerpt ? `- ${r.excerpt.trim()}…` : ''))
    .filter(Boolean);
  if (items.length) {
    avoid =
      '\n\nNO repitas ni parafrasees ninguna de estas publicaciones recientes — usa otro gancho, otro ángulo y otro tema:\n' +
      items.join('\n');
  }

  const system =
    'Eres el community manager de "Capellán Auto Solution Express", un taller mecánico de confianza con sede en Bonao ' +
    'que ofrece servicio en todo el corredor Santiago–Santo Domingo y en toda la República Dominicana. Escribes en ' +
    'español dominicano, cercano y profesional. Combinas consejos prácticos de mantenimiento de autos con el mensaje de ' +
    'marca: servicio honesto, trabajo certificado, amplia cobertura, "tu auto en buenas manos". ' +
    'Nunca inventes precios, promociones, enlaces ni servicios que no se te hayan indicado.';

  const user =
    'Crea UNA "palabra de sabiduría" para redes sociales (Facebook e Instagram) que combine un consejo práctico de ' +
    'cuidado del auto con la confianza de la marca.\n\n' +
    'Devuelve SOLO un objeto JSON válido, sin texto adicional, con esta forma exacta:\n' +
    '{"hook": "...", "caption": "...", "hashtags": ["#...", "#..."]}\n\n' +
    '- "hook": frase corta y potente para mostrar SOBRE la imagen. Máximo 9 palabras. Sin emojis, sin hashtags, sin comillas. ' +
    'VARÍA la estructura cada vez — alterna entre estilos distintos: una pregunta directa, un dato o cifra concreta, ' +
    'un consejo imperativo, una advertencia, un "sabías que…", un beneficio. NO personifiques las piezas del auto ' +
    '("los frenos hablan", "las gomas hablan", etc.) ni repitas la misma fórmula o estructura de ganchos recientes.\n' +
    '- "caption": 1 a 3 oraciones para el texto de la publicación, tono cálido y profesional, máximo 1 emoji. ' +
    'Termina con una invitación suave a contactar o reservar con Capellán (sin inventar enlaces ni precios). ' +
    'NO limites la cobertura a una sola ciudad: cuando menciones ubicación o disponibilidad, refleja que dan servicio en ' +
    'Santiago, Santo Domingo y toda la República Dominicana.\n' +
    '- "hashtags": de 4 a 6 hashtags relevantes en español (autos, mantenimiento, RD, Santiago/Santo Domingo, la marca), cada uno comenzando con #.' +
    avoid;

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    throw new Error(json?.error?.message || `Anthropic API error (HTTP ${res.status})`);
  }

  const text: string = (json.content || [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('');

  return parseWisdom(text);
}

function parseWisdom(text: string): Wisdom {
  let t = (text || '').trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) t = t.slice(start, end + 1);

  const obj = JSON.parse(t);
  const hook = String(obj.hook || '').trim();
  const caption = String(obj.caption || '').trim();
  const hashtags = Array.isArray(obj.hashtags)
    ? obj.hashtags.map((h: any) => String(h).trim()).filter(Boolean)
    : [];
  if (!hook || !caption) throw new Error('Claude no devolvió hook/caption válidos');
  return { hook, caption, hashtags };
}
