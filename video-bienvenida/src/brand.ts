import { staticFile } from "remotion";

// ─── Paleta Chimichurri (extraída de assets/css/style.css) ───
export const COLORS = {
  bg: "#080808",
  surface: "#0f0f0f",
  surface2: "#161616",
  accent: "#D4FF00",
  accentDim: "rgba(212,255,0,0.08)",
  accentBorder: "rgba(212,255,0,0.22)",
  text: "#f2f2f2",
  textMuted: "#6e6e6e",
  border: "rgba(255,255,255,0.08)",
  wa: "#25D366",
};

export const FONT_TITLE = "Syne";
export const FONT_BODY = "Inter";

// Inyecta las @font-face una sola vez (fuentes locales en public/fonts).
let injected = false;
export const loadFonts = () => {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const style = document.createElement("style");
  style.innerHTML = `
    @font-face {
      font-family: "Syne";
      src: url("${staticFile("fonts/Syne.ttf")}") format("truetype");
      font-weight: 400 800;
      font-display: block;
    }
    @font-face {
      font-family: "Inter";
      src: url("${staticFile("fonts/Inter.ttf")}") format("truetype");
      font-weight: 100 900;
      font-display: block;
    }
  `;
  document.head.appendChild(style);
};
