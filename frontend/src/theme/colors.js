/**
 * QuizForge color tokens — single source of truth.
 * School theme: blue and red. Flat hex colors only: no gradients, no rgb().
 *
 * Design rule:
 *   BLUE  = structure (surfaces, borders, depth)
 *   RED   = accent only (top edge on stat cards, title markers, chart bars, low scores)
 *   GREEN / AMBER = score status only
 *
 * Layers (darkest → lightest):
 *   canvas         — page background
 *   ink            — panel header bands, dark insets (chart area, bar tracks)
 *   specialsurface — top bar, sidebar
 *   surface        — outer wells behind the cards
 *   darkteal       — card and panel bodies (lighter than the well, so they lift)
 *   darkslate      — hover rows, bar tracks, avatar chips
 *   mutedteal      — hover state for cards
 *
 * Lines and depth:
 *   line   — borders and dividers
 *   shadow — card shadow color
 *
 * Text:
 *   inkondark — primary text on dark backgrounds
 *   muted     — subtitles and placeholders
 *   mutedonlight — secondary text on light backgrounds
 *   logininput — login form fields on the light paper card
 *   logininputborder — borders for login form fields on light backgrounds
 *   logininputoutline — blue outline for login form fields
 *   white
 *
 * Brand / status:
 *   accent   — school red
 *   accept   — green: high scores
 *   warn     — amber: middle scores
 *   bad      — light red for text on dark backgrounds
 *   ccdiblue — school blue (bright), used for the class ranking bar
 *
 * Scrollbar (red):
 *   scrolltrack / scrollthumb / scrollthumbhover
 *
 * Other:
 *   modalback
 */
export const colors = {
  canvas: "#1B3478",
  ink: "#091337",
  specialsurface: "#0B1740",
  surface: "#0C1946",
  darkteal: "#12265F",
  darkslate: "#F4A340",
  mutedteal: "#2A4AA0",
  line: "#2D4688",
  shadow: "#02061A",
  inkondark: "#F8FAFC",
  muted: "#8FA6CC",
  mutedonlight: "#52627A",
  coffeewhite: "#FFFDF9",
  logininput: "#FFFDF9",
  logininputfocus: "#000000",
  logininputborder: "#C8B293",
  logininputoutline: "#1B3478",
  white: "#FFFFFF",
  accent: "#C8102E",
  accept: "#22C55E",
  warn: "#F59E0B",
  bad: "#FF6B81",
  ccdiblue: "#2F6BFF",
  modalback: "#0B1740",
  scrolltrack: "#0B1740",
  scrollthumb: "#C8102E",
  scrollthumbhover: "#E11D48",
};

export default colors;
