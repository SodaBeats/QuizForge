/**
 * QuizForge color tokens — single source of truth.
 * Dark surfaces and semantic status colors are the default; portal pages use
 * warm orange as their accent.
 * Flat hex colors only: no gradients, no rgb().
 *
 * Design rule:
 *   DARK = structure (surfaces, borders, depth)
 *   RED = default accent and low-score status
 *   ORANGE = teacher/student portal accent
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
 *   accent   — default school red; overridden to warmorange in the teacher theme
 *   warmorange — warm orange for portal pages
 *   studentpage / studentcard / studentinput — dark surfaces reused by the teacher theme
 *   studentinputborder — token input borders
 *   spinnergreen — green for shared loading indicators
 *   accept   — green: high scores
 *   warn     — amber: middle scores
 *   bad      — light red for text on dark backgrounds
 *   ccdiblue — school blue (bright), used for the class ranking bar
 *
 * Scrollbar (red by default; orange in the teacher theme):
 *   scrolltrack / scrollthumb / scrollthumbhover
 *
 * Other:
 *   modalback
 */
export const colors = {
  canvas: "#111014",
  ink: "#111014",
  specialsurface: "#17161B",
  surface: "#17161B",
  darkteal: "#17161B",
  darkslate: "#242328",
  mutedteal: "#39363E",
  line: "#39363E",
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
  accent: "#FF6A00",
  warmorange: "#FF6A00",
  studentpage: "#111014",
  studentcard: "#17161B",
  studentinput: "#242328",
  studentinputborder: "#39363E",
  spinnergreen: "#22C55E",
  accept: "#22C55E",
  warn: "#F59E0B",
  bad: "#FF6B81",
  ccdiblue: "#2F6BFF",
  modalback: "#0B1740",
  scrolltrack: "#0B1740",
  scrollthumb: "#C8102E",
  clipboard: "#8b5a2b",
  clipboardedge: " #5c3a1a",
  scrollthumbhover: "#E11D48",
};

export default colors;
