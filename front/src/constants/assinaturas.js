// Componente: assinaturas (constants)
// Responsabilidade: fonte única de verdade para serviços de assinatura predefinidos

export const ASSINATURAS_PREFIX = 'assinaturas.';

export const ASSINATURAS = [
  { key: 'spotify',       label: 'Spotify',          simpleIconsSlug: 'spotify',     iconColor: '1DB954', iconFallback: '🎵' },
  { key: 'netflix',       label: 'Netflix',           simpleIconsSlug: 'netflix',     iconColor: 'E50914', iconFallback: '🎬' },
  { key: 'amazonprime',   label: 'Amazon Prime',      simpleIconsSlug: 'primevideo',  iconColor: '00A8E0', iconFallback: '📦' },
  { key: 'disneyplus',    label: 'Disney+',           simpleIconsSlug: 'disneyplus',  iconColor: '113CCF', iconFallback: '🎭' },
  { key: 'max',           label: 'Max',               simpleIconsSlug: 'hbo',         iconColor: '002BE7', iconFallback: '🎥' },
  { key: 'youtubepremium',label: 'YouTube Premium',   simpleIconsSlug: 'youtube',     iconColor: 'FF0000', iconFallback: '▶️' },
  { key: 'applemusic',    label: 'Apple Music',       simpleIconsSlug: 'applemusic',  iconColor: 'FA243C', iconFallback: '🎶' },
  { key: 'chatgptplus',   label: 'ChatGPT Plus',      simpleIconsSlug: null,          iconColor: null,     iconFallback: '🤖' },
  { key: 'googleone',     label: 'Google One',        simpleIconsSlug: 'google',      iconColor: '4285F4', iconFallback: '☁️' },
  { key: 'adobe',         label: 'Adobe',             simpleIconsSlug: 'adobe',       iconColor: 'FF0000', iconFallback: '🎨' },
  { key: 'outros',        label: 'Outros',            simpleIconsSlug: null,          iconColor: null,     iconFallback: '📦' },
];

export const ASSINATURAS_MAP = Object.fromEntries(ASSINATURAS.map((a) => [a.key, a]));

export const resolverAssinatura = (categoria) => {
  if (!categoria || !String(categoria).startsWith(ASSINATURAS_PREFIX)) return null;
  const key = String(categoria).slice(ASSINATURAS_PREFIX.length);
  return ASSINATURAS_MAP[key] || null;
};

export const labelAssinatura = (categoria) => {
  const a = resolverAssinatura(categoria);
  return a ? a.label : categoria;
};

/** Retorna URL do ícone ou null para a entrada "outros" */
export const iconeUrlAssinatura = (categoria) => {
  const a = resolverAssinatura(categoria);
  if (!a || !a.simpleIconsSlug) return null;
  return `https://cdn.simpleicons.org/${a.simpleIconsSlug}/${a.iconColor}`;
};

export const iconeFallbackAssinatura = (categoria) => {
  const a = resolverAssinatura(categoria);
  return a ? a.iconFallback : '📦';
};
