"use client";
import Image from "next/image";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { categories } from "@/lib/collections";
import type { Photo } from "@/lib/photos";
type Props = {
  selected: string;
  filtered: Photo[];
  visible: Photo[];
  showAll: boolean;
  onSelect: (id: string) => void;
  onShowAll: () => void;
  onOpen: (index: number) => void;
};
export default function CollectionSection({
  selected,
  filtered,
  visible,
  showAll,
  onSelect,
  onShowAll,
  onOpen,
}: Props) {
  return (
    <section
      id="collection"
      className="scroll-mt-20 bg-[#f5f2e9] px-5 pt-20 pb-24 sm:px-8 lg:px-12 lg:pt-28 xl:px-20"
    >
      <div className="reveal-section mx-auto flex max-w-[1450px] flex-wrap items-end justify-between gap-6 pb-8">
        <div>
          <p className="mb-4 text-[11px] tracking-[.25em] text-[#786f60] uppercase">
            Stories in still frames
          </p>

          <h2 className="font-serif text-[clamp(2.6rem,5.5vw,5.5rem)] leading-none text-[#20352c]">
            Explore the <em>collection.</em>
          </h2>
        </div>

        <span className="text-xs tracking-widest text-[#746e63]">
          {filtered.length.toString().padStart(2, "0")} PHOTOGRAPHS
        </span>
      </div>
        <div className="mx-auto mb-10 flex max-w-[1450px] flex-wrap gap-2">
          {[{ id: "all", title: "All moments" }, ...categories].map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              aria-pressed={selected === c.id}
              className={`rounded-full border px-4 py-2.5 text-xs transition sm:px-5 ${selected === c.id ? "border-[#20352c] bg-[#20352c] text-white" : "border-[#c9c4b6] text-[#3c473c] hover:bg-[#e9e5db]"}`}
            >
              {c.title}
            </button>
          ))}
        </div>
        {selected !== "all" && (
          <div className="mx-auto mb-8 max-w-[1450px]">
            <p className="text-xs tracking-widest uppercase text-[#7b766a]">
              The collection /{" "}
              {categories.find((c) => c.id === selected)?.title}
            </p>
            <p className="mt-3 max-w-2xl font-serif text-xl text-[#263b30]">
              {categories.find((c) => c.id === selected)?.intro}
            </p>
          </div>
        )}
        <div
          key={selected}
          className="mx-auto max-w-[1450px] columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4"
        >
          {visible.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => onOpen(i)}
              aria-label={`View ${photo.title}, photograph ${i + 1}`}
              className="photo-card group mb-4 block w-full break-inside-avoid overflow-hidden text-left"
            >
              <span
                className="relative block w-full overflow-hidden bg-[#dedbd0]"
                style={{ aspectRatio: `${photo.width}/${photo.height}` }}
              >
                <Image
                  src={photo.src}
                  alt={`${photo.title}, ${photo.filename}`}
                  fill
                  sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                  quality={72}
                  loading={i < 3 ? "eager" : "lazy"}
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.045]"
                />
              </span>
              <span className="flex items-center justify-between gap-2 py-3 text-sm text-[#24382e]">
                <span>{photo.title}</span>
                <ArrowUpRight size={17} />
              </span>
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="mx-auto max-w-[1450px] py-20 text-center">
            <h3 className="font-serif text-3xl">Moments coming soon.</h3>
            <p className="mt-3 text-sm text-[#665f53]">
              Photographs will appear once their WordPress URLs are available.
            </p>
          </div>
        )}
        {!showAll && filtered.length > 48 && (
          <div className="mt-12 text-center">
            <button
              onClick={onShowAll}
              className="inline-flex items-center gap-4 rounded-full border border-[#20352c] px-7 py-3 text-sm text-[#20352c] hover:bg-[#20352c] hover:text-white"
            >
              View all {filtered.length} photographs{" "}
              <ArrowDownRight size={18} />
            </button>
          </div>
        )}
      </section>
  );
}
