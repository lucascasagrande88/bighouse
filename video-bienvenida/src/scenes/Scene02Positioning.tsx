import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "../brand";
import { Kicker, RiseLine } from "../components";
import { SceneFade } from "../fade";

// El mensaje de posicionamiento del sitio:
// "No importa si tu negocio es bueno. Si se ve mal, perdés ventas todos los días."
export const Scene02Positioning: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const underline = interpolate(frame, [70, 92], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneFade durationInFrames={durationInFrames}>
      <Kicker delay={6}>Por qué estás acá</Kicker>

      <RiseLine delay={14} style={{ fontSize: 66, color: COLORS.textMuted, fontWeight: 700 }}>
        No importa si
      </RiseLine>
      <RiseLine delay={20} style={{ fontSize: 66, color: COLORS.textMuted, fontWeight: 700 }}>
        tu negocio es
      </RiseLine>
      <RiseLine delay={26} style={{ fontSize: 66, color: COLORS.textMuted, fontWeight: 700 }}>
        bueno.
      </RiseLine>

      <div style={{ height: 36 }} />

      <RiseLine delay={46} style={{ fontSize: 76 }}>
        Si se ve mal,
      </RiseLine>
      <div style={{ position: "relative", width: "fit-content" }}>
        <RiseLine delay={56} style={{ fontSize: 76 }}>
          perdés ventas.
        </RiseLine>
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 6,
            height: 10,
            width: `${underline}%`,
            backgroundColor: COLORS.accent,
            borderRadius: 4,
          }}
        />
      </div>
    </SceneFade>
  );
};
