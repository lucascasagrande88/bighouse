import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_BODY, FONT_TITLE } from "../brand";
import { Dot, RiseLine } from "../components";
import { SceneFade } from "../fade";

export const Scene01Hero: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Wordmark "Chimichurri" entra letra-bloque
  const wm = spring({ frame: frame - 18, fps, config: { damping: 16 } });
  const wmY = interpolate(wm, [0, 1], [40, 0]);

  return (
    <SceneFade durationInFrames={durationInFrames} style={{ justifyContent: "flex-end", paddingBottom: 220 }}>
      {/* logo lockup: punto + wordmark, como el nav del sitio */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 48 }}>
        <Dot size={26} delay={4} pulse />
        <span
          style={{
            fontFamily: FONT_TITLE,
            fontWeight: 800,
            fontSize: 46,
            letterSpacing: "-0.02em",
            color: COLORS.text,
            opacity: wm,
            transform: `translateY(${wmY}px)`,
          }}
        >
          Chimichurri
        </span>
      </div>

      <RiseLine delay={34} style={{ fontSize: 90 }}>
        Te damos la
      </RiseLine>
      <RiseLine delay={46} style={{ fontSize: 90, color: COLORS.accent }}>
        bienvenida.
      </RiseLine>

      <div
        style={{
          marginTop: 44,
          fontFamily: FONT_BODY,
          fontWeight: 500,
          fontSize: 34,
          color: COLORS.textMuted,
          letterSpacing: "0.02em",
          opacity: interpolate(frame, [64, 80], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Studio de diseño · Buenos Aires
      </div>
    </SceneFade>
  );
};
