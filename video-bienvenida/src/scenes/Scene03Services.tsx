import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_BODY, FONT_TITLE } from "../brand";
import { Kicker } from "../components";
import { SceneFade } from "../fade";

const SERVICES = [
  { n: "01", t: "Identidad & redes", d: "Logo, branding, feed de Instagram, menú digital" },
  { n: "02", t: "Físico & imprenta", d: "Carteles, menús, señalética, packaging, vinilos" },
  { n: "03", t: "Experiencias", d: "Pantallas, vidriera, ambientación y activaciones" },
];

const Row: React.FC<{ s: (typeof SERVICES)[0]; delay: number }> = ({ s, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame: frame - delay, fps, config: { damping: 18, mass: 0.9 } });
  const x = interpolate(sp, [0, 1], [-70, 0]);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 32,
        padding: "34px 0",
        borderBottom: `1px solid ${COLORS.border}`,
        opacity: sp,
        transform: `translateX(${x}px)`,
      }}
    >
      <span
        style={{
          fontFamily: FONT_TITLE,
          fontWeight: 800,
          fontSize: 44,
          color: COLORS.accent,
          width: 90,
          flexShrink: 0,
        }}
      >
        {s.n}
      </span>
      <div>
        <div
          style={{
            fontFamily: FONT_TITLE,
            fontWeight: 800,
            fontSize: 62,
            color: COLORS.text,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          {s.t}
        </div>
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 32,
            color: COLORS.textMuted,
            marginTop: 8,
          }}
        >
          {s.d}
        </div>
      </div>
    </div>
  );
};

export const Scene03Services: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  return (
    <SceneFade durationInFrames={durationInFrames}>
      <Kicker delay={6}>Lo que hacemos por vos</Kicker>
      <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 10 }}>
        {SERVICES.map((s, i) => (
          <Row key={s.n} s={s} delay={18 + i * 16} />
        ))}
      </div>
    </SceneFade>
  );
};
