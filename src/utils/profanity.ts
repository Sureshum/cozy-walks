// Validación de nombres de usuario: longitud, caracteres y palabras obscenas
// (español + inglés). No pretende ser perfecto, solo evitar los casos evidentes.

const BLOCKED_WORDS: string[] = [
  // Español
  'puta', 'puto', 'putas', 'putos', 'putita', 'putito', 'putazo', 'putamadre',
  'mierda', 'mierdas', 'mierdero', 'mierdoso',
  'pendejo', 'pendeja', 'pendejos', 'pendejas', 'pendejada', 'pendejadas',
  'cabron', 'cabrona', 'cabrones', 'cabronas', 'cabronazo',
  'verga', 'vergas', 'vergazo', 'verguero',
  'joder', 'jodete', 'jodido', 'jodida', 'jodidos', 'jodidas',
  'cono', // coño (sin la ñ al normalizar)
  'gilipollas', 'imbecil', 'imbeciles', 'idiota', 'idiotas',
  'zorra', 'zorras', 'perra', 'perras',
  'marica', 'maricon', 'maricones', 'mariconazo',
  'hijueputa', 'hijueputas', 'hijodeputa', 'hdp',
  'malparido', 'malparida', 'malparidos',
  'carechimba', 'careverga', 'gonorrea',
  'mamon', 'mamona', 'mamones',
  'culiao', 'culiada', 'culiado', 'culiadera',
  'weon', 'weona', 'weones', 'huevon', 'huevona', 'huevones',
  'boludo', 'boluda', 'boludos', 'pelotudo', 'pelotuda', 'pelotudos',
  'chingar', 'chingada', 'chingado', 'chingadas', 'chinga',
  'culo', 'culos', 'culito', 'tetas', 'pija', 'pijudo',
  // Inglés
  'fuck', 'fucking', 'fucker', 'fucked', 'motherfucker',
  'shit', 'shitty', 'bitch', 'bitches', 'asshole', 'assholes',
  'bastard', 'dick', 'dicks', 'cunt', 'whore', 'slut', 'pussy',
  'cock', 'retard', 'retarded', 'wanker', 'twat', 'bollocks',
  'nigger', 'nigga', 'faggot', 'fag', 'porn', 'porno',
  // Odio
  'nazi', 'hitler',
];

// Normaliza: minúsculas, sin acentos, sin "leet" (p4l4br4) y sin separadores
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[0]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[4]/g, 'a')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[^a-z]+/g, ' ')
    .trim();
}

function collapseRepeats(value: string): string {
  return value.replace(/(.)\1+/g, '$1');
}

export function containsProfanity(text: string): boolean {
  const normalized = normalize(text);
  if (!normalized) return false;

  const tokens = normalized.split(' ').filter(Boolean);
  const compact = tokens.join('');

  for (const word of BLOCKED_WORDS) {
    const collapsedWord = collapseRepeats(word);

    // Coincidencia por palabra completa (incluye "puuuta" o "p3nd3j0")
    for (const token of tokens) {
      if (
        token === word ||
        token === collapsedWord ||
        collapseRepeats(token) === word ||
        collapseRepeats(token) === collapsedWord
      ) {
        return true;
      }
    }

    // Letras separadas: "p u t a" / "p.u.t.a"
    if (tokens.length > 3 && tokens.every((t) => t.length <= 2) && compact.includes(word)) {
      return true;
    }
  }

  return false;
}

export interface UsernameCheck {
  ok: boolean;
  reason?: string;
}

export function checkUsername(raw: string): UsernameCheck {
  const username = raw.trim();

  if (username.length < 3) {
    return { ok: false, reason: 'El nombre debe tener al menos 3 caracteres' };
  }
  if (username.length > 20) {
    return { ok: false, reason: 'El nombre no puede pasar de 20 caracteres' };
  }
  if (!/^[\p{L}\p{N} _.-]+$/u.test(username)) {
    return { ok: false, reason: 'Usa solo letras, números, espacios, guiones o puntos' };
  }
  if (containsProfanity(username)) {
    return { ok: false, reason: 'Ese nombre no está permitido. Elige otro, por favor.' };
  }

  return { ok: true };
}
