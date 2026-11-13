import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { loadFonts } from "./brand";
import { Backdrop } from "./components";
import { Scene01Hero } from "./scenes/Scene01Hero";
import { Scene02Positioning } from "./scenes/Scene02Positioning";
import { Scene03Services } from "./scenes/Scene03Services";
import { Scene04Portal } from "./scenes/Scene04Portal";
import { Scene05CTA } from "./scenes/Scene05CTA";

loadFonts();

// Escenas con un pequeño solape para que los fades se crucen (crossfade).
const OVERLAP = 10;
const D = { hero: 110, pos: 150, serv: 195, portal: 150, cta: 165 };

export const Bienvenida: React.FC = () => {
  let at = 0;
  const next = (dur: number) => {
    const from = at;
    at += dur - OVERLAP;
    return { from, durationInFrames: dur };
  };

  const hero = next(D.hero);
  const pos = next(D.pos);
  const serv = next(D.serv);
  const portal = next(D.portal);
  const cta = next(D.cta);

  return (
    <AbsoluteFill>
      {/* Fondo continuo durante todo el video para dar continuidad */}
      <Backdrop />
      <Sequence from={hero.from} durationInFrames={hero.durationInFrames}>
        <Scene01Hero durationInFrames={hero.durationInFrames} />
      </Sequence>
      <Sequence from={pos.from} durationInFrames={pos.durationInFrames}>
        <Scene02Positioning durationInFrames={pos.durationInFrames} />
      </Sequence>
      <Sequence from={serv.from} durationInFrames={serv.durationInFrames}>
        <Scene03Services durationInFrames={serv.durationInFrames} />
      </Sequence>
      <Sequence from={portal.from} durationInFrames={portal.durationInFrames}>
        <Scene04Portal durationInFrames={portal.durationInFrames} />
      </Sequence>
      <Sequence from={cta.from} durationInFrames={cta.durationInFrames}>
        <Scene05CTA durationInFrames={cta.durationInFrames} />
      </Sequence>
    </AbsoluteFill>
  );
};

// Duración total = suma de escenas menos los solapes.
export const TOTAL_FRAMES =
  D.hero + D.pos + D.serv + D.portal + D.cta - OVERLAP * 4;
