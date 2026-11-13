import React from "react";
import { Composition } from "remotion";
import { Bienvenida, TOTAL_FRAMES } from "./Bienvenida";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Bienvenida"
      component={Bienvenida}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
