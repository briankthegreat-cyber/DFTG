import type { Metadata } from "next";
import CosmicDrift from "./CosmicDrift";

export const metadata: Metadata = {
  title: {
    absolute: "Cosmic Drift — Eat the Universe",
  },
  description:
    "A momentum-based cosmic arcade game. Absorb smaller celestial bodies, evade giants, catch Prism Comets, and evolve into a Singularity.",
};

export default function Home() {
  return <CosmicDrift />;
}
