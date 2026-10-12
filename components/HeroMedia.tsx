"use client";

import { useEffect, useRef, useState } from "react";

interface HeroMediaProps {
  src?: string;
}

export default function HeroMedia({
  src = process.env.NEXT_PUBLIC_HERO_VIDEO_URL || "/videos/hero.mp4",
}: HeroMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncMotion = () => {
      if (media.matches) {
        videoRef.current?.pause();
      } else {
        videoRef.current?.play().catch(() => {
          // Autoplay may be blocked by browser settings.
        });
      }
    };

    syncMotion();
    media.addEventListener("change", syncMotion);

    return () => media.removeEventListener("change", syncMotion);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden bg-[#1b2c22]"
    >
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        disablePictureInPicture
        onCanPlay={() => setCanPlay(true)}
        onError={() => setCanPlay(false)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          canPlay ? "opacity-100" : "opacity-0"
        }`}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
