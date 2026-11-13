import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONT_BODY, FONT_TITLE } from "../brand";
import { Kicker, RiseLine } from "../components";
import { SceneFade } from "../fade";

const CHIPS = ["Mis entregas", "Aprobar diseño", "Enviar materiales", "Descargas"];

const Chip: React.FC<{ label: string; delay: number }> = ({ label, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame: frame - delay, fps, config: { damping: 14, mass: 0.6 } });
  return (
    <div
      style={{
        fontFamily: FONT_BODY,
        fontWeight: 700,
        fontSize: 34,
        color: COLORS.accent,
        padding: "16px 30px",
        borderRadius: 100,
        border: `1.5px solid ${COLORS.accentBorder}`,
        background: COLORS.accentDim,
        transform: `scale(${sp})`,
        opacity: sp,
      }}
    >
      {label}
    </div>
  );
};

export const Scene04Portal: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  return (
    <SceneFade durationInFrames={durationInFrames}>
      <Kicker delay={6}>Tu portal de cliente</Kicker>
      <RiseLine delay={14} style={{ fontSize: 88 }}>
        Todo en un
      </RiseLine>
      <RiseLine delay={24} style={{ fontSize: 88, color: COLORS.accent }}>
        solo lugar.
      </RiseLine>

      <div
        style={{
          fontFamily: FONT_BODY,
          fontSize: 38,
          color: COLORS.textMuted,
          marginTop: 30,
          opacity: interpolate(frame, [40, 56], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Entregas, aprobaciones y materiales — sin perderte en mails.
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 56 }}>
        {CHIPS.map((c, i) => (
          <Chip key={c} label={c} delay={58 + i * 10} />
        ))}
      </div>
    </SceneFade>
  );
};
