import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_BODY, FONT_TITLE } from "../brand";
import { Dot, RiseLine } from "../components";
import { SceneFade } from "../fade";

export const Scene05CTA: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const btn = spring({ frame: frame - 50, fps, config: { damping: 13, mass: 0.7 } });
  const wmk = interpolate(frame, [70, 86], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneFade durationInFrames={durationInFrames} style={{ alignItems: "flex-start" }}>
      <RiseLine delay={10} style={{ fontSize: 88 }}>
        ¿Arrancamos
      </RiseLine>
      <RiseLine delay={20} style={{ fontSize: 88 }}>
        tu <span style={{ color: COLORS.accent }}>proyecto?</span>
      </RiseLine>

      <div
        style={{
          fontFamily: FONT_BODY,
          fontSize: 38,
          color: COLORS.textMuted,
          marginTop: 30,
          opacity: interpolate(frame, [34, 48], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Escribinos y te decimos qué pack te conviene.
      </div>

      {/* Botón WhatsApp, estilo del sitio */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: 56,
          padding: "26px 46px",
          borderRadius: 100,
          backgroundColor: COLORS.wa,
          transform: `scale(${btn})`,
          opacity: btn,
        }}
      >
        <svg width="46" height="46" viewBox="0 0 24 24" fill="#000">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.01c-.24.68-1.42 1.3-1.95 1.34-.5.04-.97.22-3.27-.68-2.76-1.09-4.5-3.91-4.64-4.09-.14-.18-1.12-1.49-1.12-2.84 0-1.35.71-2.01.96-2.29.24-.27.53-.34.71-.34.18 0 .36 0 .51.01.16.01.38-.06.6.46.24.56.79 1.94.86 2.08.07.14.12.3.02.48-.09.18-.14.3-.27.46-.14.16-.29.36-.41.48-.14.14-.28.29-.12.57.16.27.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.21 1.36.27.14.43.12.59-.07.16-.18.68-.79.86-1.07.18-.27.36-.22.6-.13.24.09 1.55.73 1.82.86.27.14.45.2.51.31.07.11.07.64-.17 1.32z" />
        </svg>
        <span style={{ fontFamily: FONT_BODY, fontWeight: 800, fontSize: 44, color: "#000" }}>
          Hablemos por WhatsApp
        </span>
      </div>

      {/* firma final */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: 90,
          opacity: wmk,
        }}
      >
        <Dot size={22} delay={70} pulse />
        <span
          style={{
            fontFamily: FONT_TITLE,
            fontWeight: 800,
            fontSize: 48,
            letterSpacing: "-0.02em",
            color: COLORS.text,
          }}
        >
          Chimichurri
        </span>
        <span
          style={{
            fontFamily: FONT_BODY,
            fontWeight: 500,
            fontSize: 30,
            color: COLORS.textMuted,
            marginLeft: 8,
          }}
        >
          Diseño que vende.
        </span>
      </div>
    </SceneFade>
  );
};
