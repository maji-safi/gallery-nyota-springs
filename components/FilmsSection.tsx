
"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  Pause,
  Play,
} from "lucide-react";
import { videos } from "@/data/videos";

const PLAY_SECONDS = 30;

export default function FilmsSection({
  onOpen: _onOpen,
}: {
  onOpen?: (id: string) => void;
}) {
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStart = useRef<number | null>(null);

  const current = videos[active];

  const goTo = (index: number) => {
    setActive((index + videos.length) % videos.length);
    setProgress(0);
    setError(false);
    setPaused(false);
  };

  const next = () => goTo(active + 1);
  const previous = () => goTo(active - 1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || paused) return;

    video.play().catch(() => {
      setPaused(true);
    });
  }, [active, paused]);

  const togglePause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play()
        .then(() => setPaused(false))
        .catch(() => setPaused(true));
    } else {
      video.pause();
      setPaused(true);
    }
  };

  const updateProgress = () => {
    const video = videoRef.current;
    if (!video) return;

    const elapsed = video.currentTime;
    setProgress(
      Math.min((elapsed / PLAY_SECONDS) * 100, 100)
    );

    if (elapsed >= PLAY_SECONDS) {
      next();
    }
  };

  if (!videos.length) {
    return (
      <section
        id="films"
        className="flex min-h-[60svh] items-center justify-center bg-[#20352c] px-6 text-center text-white"
      >
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.25em]">
            Nyota Springs Films
          </p>
          <h2 className="font-display text-4xl font-normal">
            Moments in motion. Coming soon.
          </h2>
        </div>
      </section>
    );
  }

  return (
    <section
      id="films"
      aria-label="Nyota Springs film collection"
      className="relative isolate h-[100svh] min-h-[480px] overflow-hidden bg-[#14231c] text-white"
    >
      {/* Active fullscreen video */}
      <video
        key={current.id}
        ref={videoRef}
        src={current.src}
        autoPlay
        muted={muted}
        playsInline
        preload="auto"
        disablePictureInPicture
        onTimeUpdate={updateProgress}
        onEnded={next}
        onError={() => setError(true)}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Subtle overlay: leave central watermark visible */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />

      {/* Swipe support */}
      <div
        className="absolute inset-0 z-10"
        onTouchStart={(event) => {
          touchStart.current = event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;

          const delta =
            event.changedTouches[0].clientX -
            touchStart.current;

          if (Math.abs(delta) > 60) {
            if (delta < 0) next();
            else previous();
          }

          touchStart.current = null;
        }}
      />

      {/* Top heading */}
      <div className="pointer-events-none absolute left-5 right-5 top-8 z-20 sm:left-10 sm:right-10 lg:left-20">
        <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-white/75 sm:text-xs">
          Movement & Memory
        </p>
        <h2 className="font-display text-3xl font-normal leading-tight sm:text-5xl">
          Beyond <em>the frame.</em>
        </h2>
      </div>

      {/* Bottom content */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 px-5 pb-8 sm:px-10 sm:pb-10 lg:px-20 lg:pb-12">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div className="max-w-[75%]">
            <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-white/70">
              Nyota Springs · Maasai Mara
            </p>

            <h3 className="font-display text-3xl font-normal leading-tight sm:text-5xl lg:text-6xl">
              {current.title}
            </h3>

            <p className="mt-3 text-xs text-white/70 sm:text-sm">
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(videos.length).padStart(2, "0")}
              {" · "}
              30-second preview
            </p>
          </div>

          {/* Video controls */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={togglePause}
              aria-label={paused ? "Play video" : "Pause video"}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/40 bg-black/25 backdrop-blur-md transition hover:bg-white/20 sm:h-12 sm:w-12"
            >
              {paused ? <Play size={18} /> : <Pause size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setMuted(!muted)}
              aria-label={muted ? "Unmute video" : "Mute video"}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/40 bg-black/25 backdrop-blur-md transition hover:bg-white/20 sm:h-12 sm:w-12"
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>

        {/* Previous / next */}
        <div className="pointer-events-auto mb-7 flex items-center justify-between">
          <button
            type="button"
            onClick={previous}
            aria-label="Previous film"
            className="flex items-center gap-2 text-xs tracking-wider text-white/85 transition hover:text-white"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <button
            type="button"
            onClick={next}
            aria-label="Next film"
            className="flex items-center gap-2 text-xs tracking-wider text-white/85 transition hover:text-white"
          >
            <span className="hidden sm:inline">Next film</span>
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Progress segments */}
        <div className="pointer-events-auto flex gap-1.5">
          {videos.map((film, index) => (
            <button
              key={film.id}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Play ${film.title}`}
              aria-current={index === active ? "true" : undefined}
              className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/30"
            >
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-150"
                style={{
                  width:
                    index < active
                      ? "100%"
                      : index === active
                        ? `${progress}%`
                        : "0%",
                }}
              />
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-amber-200">
            This film could not be loaded. Select the next film.
          </p>
        )}
      </div>
    </section>
  );
}
