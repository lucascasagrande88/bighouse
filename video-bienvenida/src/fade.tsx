import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

// Fade de entrada/salida por escena. El frame se reinicia dentro de cada
// <Sequence>, así que usamos el frame local + la duración de la escena.
export const SceneFade: React.FC<{
  durationInFrames: number;
  children: React.ReactNode;
  enter?: number;
  exit?: number;
  style?: React.CSSProperties;
}> = ({ durationInFrames, children, enter = 14, exit = 14, style }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, enter, durationInFrames - exit, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return (
    <AbsoluteFill
      style={{
        opacity,
        padding: "0 72px",
        justifyContent: "center",
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
