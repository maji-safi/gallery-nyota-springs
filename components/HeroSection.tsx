"use client";
import { ArrowDownRight } from "lucide-react";
import HeroMedia from "@/components/HeroMedia";
import type { Photo } from "@/lib/photos";
export default function HeroSection({ cover }: { cover?: Photo }) {
  return (
    <section
      id="story"
      className="relative flex min-h-[680px] h-[100svh] items-end overflow-hidden bg-[#14251c] text-white"
    >
      <HeroMedia />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/30" />
      <div className="relative z-10 mx-auto mb-[clamp(68px,10vh,130px)] w-full max-w-[1500px] px-5 sm:px-8 lg:px-12 xl:px-20">
        <div className="max-w-[390px] sm:max-w-[440px] lg:max-w-[470px]">
          <p className="hero-reveal mb-4 text-[10px] font-semibold tracking-[.26em] uppercase sm:text-xs">
            The Nyota Springs gallery
          </p>
          <h1
            className="
              hero-reveal
              font-display
              text-[clamp(34px,4.1vw,64px)]
              font-normal
              leading-[1.12]
              tracking-[-0.045em]
            "
          >
            Experience the{" "}
            <em className="font-normal">
              extraordinary.
            </em>
          </h1>
          <p className="hero-reveal font-body mt-4 max-w-[360px] text-sm leading-7 text-white/85 sm:text-base">
            A glimpse of life in the Maasai Mara — discover the spaces, stories
            and moments waiting for you.
          </p>
          <a
            href="#collection"
            className="hero-reveal mt-6 inline-flex items-center gap-8 border-b border-white/65 pb-2 text-sm transition hover:gap-12"
          >
            Explore the gallery <ArrowDownRight size={18} />
          </a>
        </div>
      </div>
      <span className="absolute bottom-6 right-5 z-10 hidden text-[10px] tracking-[.23em] text-white/70 uppercase sm:block lg:right-12">
        Scroll to explore ↓
      </span>
    </section>
  );
}
