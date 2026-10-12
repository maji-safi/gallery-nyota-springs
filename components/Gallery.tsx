"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import SiteHeader from "@/components/SiteHeader";
import HeroSection from "@/components/HeroSection";
import CollectionSection from "@/components/CollectionSection";
import FilmsSection from "@/components/FilmsSection";
import SiteFooter from "@/components/SiteFooter";
import PhotoLightbox from "@/components/PhotoLightbox";
import VideoLightbox from "@/components/VideoLightbox";
import type { Photo } from "@/lib/photos";
gsap.registerPlugin(useGSAP, ScrollTrigger);
export default function Gallery({ photos }: { photos: Photo[] }) {
  const [selected, setSelected] = useState("all");
  const [active, setActive] = useState<number | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const filtered = useMemo(
    () =>
      selected === "all"
        ? photos
        : photos.filter((p) => p.category === selected),
    [photos, selected],
  );
  const visible = showAll ? filtered : filtered.slice(0, 48);
  const cover = photos.find((p) => p.category === "main-area") || photos[0];
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".hero-reveal", {
        y: 36,
        autoAlpha: 0,
        duration: 1,
        stagger: 0.14,
        ease: "power3.out",
      });
      gsap.utils
        .toArray<HTMLElement>(".reveal-section")
        .forEach((el) =>
          gsap.fromTo(
            el,
            { y: 35, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.8,
              ease: "power2.out",
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
            },
          ),
        );
    },
    { scope: root },
  );
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        ".photo-card",
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.035,
          ease: "power2.out",
          clearProps: "all",
        },
      );
    },
    { scope: root, dependencies: [selected, showAll], revertOnUpdate: true },
  );
  useEffect(() => {
    setShowAll(false);
    setActive(null);
  }, [selected]);
  useEffect(() => {
    if (active === null && !video) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActive(null);
        setVideo(null);
      }
      if (active !== null && e.key === "ArrowRight")
        setActive((active + 1) % filtered.length);
      if (active !== null && e.key === "ArrowLeft")
        setActive((active - 1 + filtered.length) % filtered.length);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [active, video, filtered]);
  const changeCategory = (id: string) => {
    setSelected(id);
    document
      .getElementById("collection")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <main ref={root}>
      <SiteHeader />
      <HeroSection cover={cover} />
      <CollectionSection selected={selected} filtered={filtered} visible={visible} showAll={showAll} onSelect={changeCategory} onShowAll={() => setShowAll(true)} onOpen={setActive} />
      <FilmsSection onOpen={setVideo} />
      <SiteFooter />
      <PhotoLightbox active={active} photos={filtered} onClose={() => setActive(null)} onChange={setActive} />
      <VideoLightbox video={video} onClose={() => setVideo(null)} />
    </main>
  );
}
