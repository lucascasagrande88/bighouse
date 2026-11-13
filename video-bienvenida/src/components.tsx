import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONT_BODY, FONT_TITLE } from "./brand";

// ─── Fondo de marca: negro + glow lima sutil que respira ───
export const Backdrop: React.FC<{ glow?: boolean }> = ({ glow = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const breathe = Math.sin((frame / fps) * 0.9) * 0.5 + 0.5;
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {glow && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(60% 45% at 72% 20%, rgba(212,255,0,${
              0.05 + breathe * 0.04
            }) 0%, transparent 70%)`,
          }}
        />
      )}
      {/* grano/vignette para quitar el plano plano "de IA" */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// ─── El punto lima del logo, como motivo recurrente ───
export const Dot: React.FC<{
  size?: number;
  delay?: number;
  pulse?: boolean;
}> = ({ size = 22, delay = 0, pulse = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - delay, fps, config: { damping: 12, mass: 0.6 } });
  const glow = pulse ? Math.sin((frame / fps) * 6) * 0.5 + 0.5 : 1;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: COLORS.accent,
        transform: `scale(${pop})`,
        boxShadow: `0 0 ${18 + glow * 26}px rgba(212,255,0,${0.4 + glow * 0.4})`,
        flexShrink: 0,
      }}
    />
  );
};

// ─── Línea que entra desde abajo con máscara (reveal editorial) ───
export const RiseLine: React.FC<{
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, mass: 0.8 } });
  const y = interpolate(s, [0, 1], [118, 0]);
  const opacity = interpolate(s, [0, 1], [0, 1]);
  return (
    <div style={{ overflow: "hidden", display: "block", padding: "0 0 2px" }}>
      <div
        style={{
          transform: `translateY(${y}%)`,
          opacity,
          fontFamily: FONT_TITLE,
          color: COLORS.text,
          lineHeight: 1.02,
          letterSpacing: "-0.03em",
          fontWeight: 800,
          whiteSpace: "nowrap",
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ─── Etiqueta kicker (uppercase + barrita lima), igual al sitio ───
export const Kicker: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 20 } });
  const w = interpolate(s, [0, 1], [0, 54]);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity: s,
        marginBottom: 26,
      }}
    >
      <div style={{ height: 3, width: w, backgroundColor: COLORS.accent }} />
      <span
        style={{
          fontFamily: FONT_BODY,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: COLORS.accent,
        }}
      >
        {children}
      </span>
    </div>
  );
};

// ─── Párrafo muted que aparece suave ───
export const Body: React.FC<{
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 20 } });
  const y = interpolate(s, [0, 1], [26, 0]);
  return (
    <p
      style={{
        fontFamily: FONT_BODY,
        color: COLORS.textMuted,
        fontSize: 40,
        lineHeight: 1.5,
        fontWeight: 400,
        opacity: s,
        transform: `translateY(${y}px)`,
        ...style,
      }}
    >
      {children}
    </p>
  );
};
