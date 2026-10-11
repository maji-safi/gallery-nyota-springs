"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface HeroMediaProps {
  poster?: string;
  posterAlt?: string;
  src?: string;
}

/** A remote WordPress cover is shown until the optional background film is ready. */
export default function HeroMedia({
  poster,
  posterAlt = "Nyota Springs Maasai Mara",
  src = process.env.NEXT_PUBLIC_HERO_VIDEO_URL || "/videos/hero.mp4",
}: HeroMediaProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [allowMotion, setAllowMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setAllowMotion(!preference.matches);
      if (preference.matches) {
        ref.current?.pause();
        setReady(false);
      }
    };
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);

  return (
    <div className="hero-photo ny-hero-media" aria-hidden="true">
      {poster ? (
        <Image
          src={poster}
          alt={posterAlt}
          fill
          priority
          sizes="100vw"
          className="ny-hero-media__poster"
        />
      ) : (
        <div className="hero-placeholder" />
      )}
      {allowMotion && src && (
        <video
          ref={ref}
          className={`ny-hero-media__video${ready ? " ny-hero-media__video--ready" : ""}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          onPlaying={() => setReady(true)}
          onError={() => setReady(false)}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
