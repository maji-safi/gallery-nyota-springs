"use client";
import Image from "next/image";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { Photo } from "@/lib/photos";
type Props = {
  active: number | null;
  photos: Photo[];
  onClose: () => void;
  onChange: (index: number) => void;
};
export default function PhotoLightbox({
  active,
  photos,
  onClose,
  onChange,
}: Props) {
  if (active === null || !photos[active]) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-[#0d1711]/98 text-white"
    >
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 px-5 py-6 sm:px-10">
        <span className="text-xs tracking-wide">
          {photos[active].title} · {active + 1} / {photos.length}
        </span>
        <button
          onClick={onClose}
          aria-label="Close photo viewer"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/30"
        >
          <X />
        </button>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onChange((active - 1 + photos.length) % photos.length);
        }}
        aria-label="Previous photograph"
        className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/45 sm:left-8"
      >
        <ArrowLeft />
      </button>
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-12 bottom-16 top-24 sm:inset-x-24"
      >
        <Image
          src={photos[active].src}
          alt={photos[active].title}
          fill
          sizes="100vw"
          quality={85}
          className="object-contain"
        />
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onChange((active + 1) % photos.length);
        }}
        aria-label="Next photograph"
        className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/45 sm:right-8"
      >
        <ArrowRight />
      </button>
    </div>
  );
}
