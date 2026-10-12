
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function SiteFooter() {
  return (
    <footer className="bg-[#f5f2e9] text-[#20352c]">
      {/* Main footer content */}
      <div className="mx-auto max-w-[1450px] px-5 pt-24 pb-20 sm:px-8 lg:px-12 lg:pt-32 xl:px-20">
        <p className="mb-6 text-xs tracking-[.25em] uppercase text-[#776e5f]">
          The journey begins here
        </p>

        <h2 className="font-display text-[clamp(3rem,7vw,7rem)] font-normal leading-[1.05]">
          Come for the views.
          <br />
          <em>Stay for the feeling.</em>
        </h2>

        <a
          href="https://nyotasprings.com"
          className="mt-9 inline-flex items-center gap-4 border-b border-[#20352c] pb-3 text-sm transition-all hover:gap-7"
        >
          Explore Nyota Springs <ArrowUpRight size={20} />
        </a>
      </div>

      {/* Full-width bottom footer */}
      <div className="w-full bg-[#20352c] text-[#f5f2e9]">
        <div className="mx-auto flex max-w-[1450px] flex-col items-center justify-between gap-6 px-5 py-8 text-center sm:px-8 md:flex-row md:text-left lg:px-12 xl:px-20">
          <Link
            href="/"
            aria-label="Nyota Springs Gallery home"
            className="block w-[150px] shrink-0 sm:w-[170px] lg:w-[190px]"
          >
            <Image
              src="/nyota-logo-cream.png"
              alt="Nyota Springs"
              width={220}
              height={60}
              className="h-auto w-full object-contain"
            />
          </Link>

          <span className="text-[10px] uppercase tracking-widest text-white/70">
            Gallery · Photographic Stories
          </span>

          <span className="text-[10px] uppercase tracking-widest text-white/70">
            © {new Date().getFullYear()} Nyota Springs
          </span>
        </div>
      </div>
    </footer>
  );
}
