import colors from "./src/theme/colors.js";

/**
 * Tailwind color names → CSS variables (var(--canvas), var(--accent), ...).
 * Edit colors in src/theme/colors.js only.
 */
const cssColors = Object.fromEntries(
  Object.keys(colors).map((name) => [
    name,
    `rgb(var(--${name}-rgb) / <alpha-value>)`,
  ]),
);

/**
 * LEGACY CLASS MAP
 * Old class names used inside components → solid hex colors from colors.js.
 * To fix any other class that lost its color, add one line here.
 */
const legacy = {
  // avatars, hover rows, soft tints
  "bg-muted/20": { "background-color": "var(--darkslate)" },
  "bg-muted/10": { "background-color": "var(--darkslate)" },
  "bg-accent/15": { "background-color": "var(--inkondark)" },
  "bg-accent/20": { "background-color": "var(--darkslate)" },

  // borders and dividers
  "border-muted/20": { "border-color": "var(--line)" },
  "border-muted/30": { "border-color": "var(--line)" },
  "border-red-400": { "border-color": "var(--bad)" },
  "border-red-400/50": { "border-color": "var(--bad)" },
  "border-red-500": { "border-color": "var(--accent)" },

  // score chips: background + text
  "bg-green-900/50": { "background-color": "var(--accept)" },
  "bg-amber-900/50": { "background-color": "var(--warn)" },
  "bg-red-900/50": { "background-color": "var(--accent)" },
  "text-green-300": { color: "var(--ink)" },
  "text-amber-300": { color: "var(--ink)" },
  "text-red-300": { color: "var(--white)" },

  // progress bars
  "bg-green-500": { "background-color": "var(--accept)" },
  "bg-amber-500": { "background-color": "var(--warn)" },
  "bg-red-500": { "background-color": "var(--accent)" },

  // percentage text
  "text-green-400": { color: "var(--accept)" },
  "text-amber-400": { color: "var(--warn)" },
  "text-red-400": { color: "var(--bad)" },
  "text-red-500": { color: "var(--accent)" },
};

/**
 * HOVER MAP
 * Classes that only apply while the mouse is over the element.
 * Written as plain base CSS, so they are always included.
 */
const hoverLegacy = {
  "hover:text-red-400": { color: "var(--bad)" },
  "hover:text-red-500": { color: "var(--bad)" },
  "hover:text-red-700": { color: "var(--bad)" },
  "hover:text-accent": { color: "var(--bad)" },
  "hover:border-red-500": { "border-color": "var(--bad)" },

  "hover:bg-green-600": {
    "background-color": "var(--accept)",
    color: "var(--white)",
  },
  "hover:bg-red-500/10": { "background-color": "var(--darkslate)" },

  "hover:bg-red-500": {
    "background-color": "var(--accent)",
    color: "var(--white)",
  },
  "hover:bg-red-700": {
    "background-color": "var(--accent)",
    color: "var(--white)",
  },
  "hover:bg-accent": {
    "background-color": "var(--accent)",
    color: "var(--white)",
  },
};

/**
 * INVISIBLE TEXT FIX
 * Dark tokens used as TEXT color would be invisible on the dark page.
 * They become readable (muted) unless the element itself has a light or
 * filled background, where dark text is correct.
 */
const DARK_TEXT = ["ink", "canvas", "surface", "specialsurface", "darkteal"];
const ON_LIGHT_OR_FILLED = [
  "bg-accept",
  "bg-accent",
  "bg-warn",
  "bg-white",
  "bg-inkondark",
  "bg-muted",
  "bg-ccdiblue",
  "bg-green",
  "bg-amber",
  "bg-red",
]
  .map((c) => `:not([class*="${c}"])`)
  .join("");

const readableDarkText = {
  [DARK_TEXT.map((t) => `.text-${t}${ON_LIGHT_OR_FILLED}`).join(", ")]: {
    color: "var(--muted) !important",
  },
};

/**
 * CANCEL / CLOSE BUTTONS — every way to recognise one without editing the
 * component. On hover the text turns light red (no red border/outline).
 *
 * CSS cannot read the word "Cancel", so we match by how the button looks:
 *   1. named: class / aria-label / title contains "cancel" or "close"
 *   2. X icon inside a button
 *   3. outlined buttons (border, not filled) — the usual cancel style
 *   4. any element with the class `cancel-btn` (exact, if you add it)
 *
 * Filled buttons (green Upload, red primary) and disabled buttons are skipped.
 */
const NOT_FILLED =
  ':not(:disabled):not([class*="bg-accent"]):not([class*="bg-accept"]):not([class*="bg-ccdiblue"])';

const cancelSelectors = [
  // 1. named
  'button[aria-label*="close" i]',
  'button[aria-label*="cancel" i]',
  'button[title*="close" i]',
  'button[title*="cancel" i]',
  'button[class*="cancel" i]',
  'button[class*="close" i]',
  // 2. X icons (Heroicons and Lucide)
  'button:has(path[d*="M6 18L18 6"])',
  'button:has(path[d*="M18 6 6 18"])',
  'button:has(path[d*="m6 6 12 12"])',
  // 3. outlined buttons
  `button[class*="border-muted"]${NOT_FILLED}`,
  `button[class*="border-line"]${NOT_FILLED}`,
  `button[class*="hover:bg-muted"]${NOT_FILLED}`,
  // 4. exact opt-in
  ".cancel-btn",
];

const cancelButtonDesign = {
  [cancelSelectors.join(", ")]: {
    transition: "color 150ms, background-color 150ms, border-color 150ms",
    cursor: "pointer",
  },
  [cancelSelectors.map((s) => `${s}:hover`).join(", ")]: {
    color: "var(--bad) !important",
  },
};

/**
 * RED SCROLLBARS — everywhere, including the file viewer.
 * !important plus higher-specificity selectors, so no component style
 * can override it.
 */
const redScrollbars = {
  "*, html body *": {
    "scrollbar-width": "thin !important",
    "scrollbar-color": "var(--scrollthumb) var(--scrolltrack) !important",
  },
  "*::-webkit-scrollbar, html body *::-webkit-scrollbar": {
    width: "10px !important",
    height: "10px !important",
    background: "var(--scrolltrack) !important",
  },
  "*::-webkit-scrollbar-track, html body *::-webkit-scrollbar-track": {
    background: "var(--scrolltrack) !important",
  },
  "*::-webkit-scrollbar-thumb, html body *::-webkit-scrollbar-thumb": {
    "background-color": "var(--scrollthumb) !important",
    background: "var(--scrollthumb) !important",
    "border-radius": "9999px !important",
    border: "2px solid var(--scrolltrack) !important",
    "background-clip": "padding-box !important",
  },
  "*::-webkit-scrollbar-thumb:hover, html body *::-webkit-scrollbar-thumb:hover":
    {
      "background-color": "var(--scrollthumbhover) !important",
      background: "var(--scrollthumbhover) !important",
      "background-clip": "padding-box !important",
    },
  "*::-webkit-scrollbar-corner, html body *::-webkit-scrollbar-corner": {
    background: "var(--scrolltrack) !important",
  },
  "*::-webkit-scrollbar-button, html body *::-webkit-scrollbar-button": {
    display: "none !important",
  },
};

/**
 * APP DESIGN
 * Restyles the existing component classes from here, so components stay
 * untouched. Blue outline + shadow for depth. No colored edges on containers.
 */
const appDesign = {
  /* Dashboard cards and panels: blue outline + depth instead of a red box */
  ".border-accent": {
    "border-color": "var(--line) !important",
    "box-shadow": "0 6px 18px var(--shadow)",
  },
  ".border-accent.bg-surface": {
    "background-color": "var(--darkteal) !important",
  },

  /* Leaderboard panels (Student ranking, Class ranking): depth */
  ".bg-darkteal.overflow-hidden": {
    "box-shadow": "0 6px 18px var(--shadow)",
  },

  /* Editor page: sidebar boxes and panels lift off the page */
  ".rounded-lg.border-muted\\/20": {
    "box-shadow": "0 6px 18px var(--shadow)",
  },

  /* Panel header bands: darker strip, no colored edge */
  ".bg-ink.rounded-t-lg, .bg-darkteal.py-3": {
    "background-color": "var(--ink) !important",
  },

  /* Chart area: dark inset so the red bars pop */
  ".relative.w-full.h-full.bg-darkslate": {
    "background-color": "var(--ink) !important",
    border: "1px solid var(--line)",
  },

  /* Class ranking bar only: school blue instead of red */
  '.h-full.rounded-full.transition-all[style*="var(--accent)"]': {
    background: "var(--ccdiblue) !important",
  },

  /* Underlined red links ("Select a quiz"): lighter red so they are readable */
  ".underline.text-accent": {
    color: "var(--bad) !important",
  },

  /* Clickable option cards (Generate, Make your own): hover lift */
  ".bg-darkslate.cursor-pointer": {
    transition: "background-color 150ms, transform 150ms",
  },
  ".bg-darkslate.cursor-pointer:hover": {
    "background-color": "var(--mutedteal) !important",
    transform: "translateY(-2px)",
  },

  ...readableDarkText,
  ...cancelButtonDesign,
};

/** Builds plain CSS rules for the hover map. */
function buildHoverRules() {
  const rules = {};
  for (const [name, declarations] of Object.entries(hoverLegacy)) {
    const selector =
      "." + name.replace(/:/g, "\\:").replace(/\//g, "\\/") + ":hover";
    rules[selector] = Object.fromEntries(
      Object.entries(declarations).map(([prop, value]) => [
        prop,
        `${value} !important`,
      ]),
    );
  }
  return rules;
}

/** Emits palette tokens and their RGB channels for Tailwind opacity utilities. */
function colorVarsPlugin({ addBase }) {
  const vars = {};
  for (const [name, value] of Object.entries(colors)) {
    vars[`--${name}`] = value;
    const r = parseInt(value.slice(1, 3), 16);
    const g = parseInt(value.slice(3, 5), 16);
    const b = parseInt(value.slice(5, 7), 16);
    vars[`--${name}-rgb`] = `${r} ${g} ${b}`;
  }
  addBase({ ":root": vars });
}

/** Page background, text, selection, focus (no outline), scrollbars, hover colors. */
function baseStylesPlugin({ addBase }) {
  addBase({
    ":root": { "color-scheme": "dark" },
    "*, ::before, ::after": {
      "border-color": "var(--line)",
      "--tw-ring-color": "transparent",
      "--tw-ring-offset-color": "var(--canvas)",
    },
    body: {
      background: "var(--canvas)",
      color: "var(--inkondark)",
    },
    "::placeholder": { color: "var(--muted)" },
    "::selection": {
      background: "var(--accent)",
      color: "var(--white)",
    },
    "*:focus, *:focus-visible": {
      outline: "none !important",
      "box-shadow": "none",
    },

    ...redScrollbars,
    ...appDesign,
    ...buildHoverRules(),
  });
}

/** Turns the legacy map into real classes. */
function legacyPlugin({ addUtilities }) {
  const rules = {};

  for (const [name, declarations] of Object.entries(legacy)) {
    const selector = "." + name.replace(/\//g, "\\/");
    rules[selector] = Object.fromEntries(
      Object.entries(declarations).map(([prop, value]) => [
        prop,
        `${value} !important`,
      ]),
    );
  }

  /**
   * MODAL BACKDROP (bg-modalback/70)
   * The element itself is transparent. A solid-color layer sits behind the
   * modal and is faded with plain `opacity`, so the page stays visible
   * through it and the modal box itself stays fully solid. No rgb() needed.
   */
  rules[".bg-modalback\\/70"] = {
    "background-color": "transparent !important",
  };
  rules[".bg-modalback\\/70::before"] = {
    content: '""',
    position: "absolute",
    inset: "0",
    "z-index": "-1",
    "background-color": "var(--modalback)",
    opacity: "0.75",
    "pointer-events": "none",
  };

  addUtilities(rules);
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      inherit: "inherit",
      ...cssColors,
    },
    borderColor: ({ theme }) => ({
      ...theme("colors"),
      DEFAULT: "var(--line)",
    }),
    divideColor: ({ theme }) => ({
      ...theme("colors"),
      DEFAULT: "var(--line)",
    }),
    ringColor: ({ theme }) => ({
      ...theme("colors"),
      DEFAULT: "transparent",
    }),
    extend: {
      fontFamily: {
        display: ["Baloo 2", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [colorVarsPlugin, baseStylesPlugin, legacyPlugin],
};
