"use client";
import { X } from "lucide-react";
import { videos } from "@/data/videos";
export default function VideoLightbox({
  video,
  onClose,
}: {
  video: string | null;
  onClose: () => void;
}) {
  const item = videos.find((v) => v.id === video);
  if (!item) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Video viewer"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0d1711]/98 px-4 py-24 text-white"
    >
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-5 sm:px-10">
        <span className="text-xs tracking-widest uppercase">
          Nyota Springs films
        </span>
        <button
          onClick={onClose}
          aria-label="Close video"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/30"
        >
          <X />
        </button>
      </div>
      <video
        key={item.id}
        src={item.src}
        controls
        autoPlay
        playsInline
        preload="none"
        className="max-h-full w-full max-w-6xl"
      />
    </div>
  );
}
