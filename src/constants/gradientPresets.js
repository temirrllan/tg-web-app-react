// Gradient presets for special habit pack cards.
// Keys match the values stored in DB (bg_color column).

const GRADIENT_PRESETS = {
  sunset:   'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  ocean:    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  forest:   'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  lavender: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  peach:    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  aurora:   'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  mint:     'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
  flamingo: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  berry:    'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
  sky:      'linear-gradient(135deg, #c1dfc4 0%, #deecdd 100%)',
  coral:    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  arctic:   'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
};

// Fallback palette for packs without a gradient key
const FALLBACK_COLORS = [
  '#c8e6c9', '#ffccbc', '#b2ebf2', '#d1c4e9',
  '#fff9c4', '#f8bbd0', '#dcedc8', '#ffe0b2',
  '#e1f5fe', '#fce4ec',
];

export const getPackBackground = (pack) => {
  if (pack?.bg_color && GRADIENT_PRESETS[pack.bg_color]) {
    return GRADIENT_PRESETS[pack.bg_color];
  }
  // Legacy support: if bg_color is a raw CSS value (hex/gradient), use it directly
  if (pack?.bg_color) return pack.bg_color;
  return FALLBACK_COLORS[((pack?.id || 1) - 1) % FALLBACK_COLORS.length];
};

export default GRADIENT_PRESETS;
