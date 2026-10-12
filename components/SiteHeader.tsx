"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu, X } from "lucide-react";
const links = [
  { href: "#story", label: "Our world" },
  { href: "#collection", label: "The collection" },
  { href: "#films", label: "Films" },
];
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 48);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${scrolled || open ? "bg-[#1c2d26]/95 shadow-lg backdrop-blur-lg" : "bg-transparent"}`}
    >
      <div className="relative mx-auto flex h-[76px] w-full max-w-[1500px] items-center justify-between px-5 sm:px-8 lg:h-[88px] lg:px-12 xl:px-20">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          aria-label="Nyota Springs Gallery home"
          className="relative z-10 block w-[140px] sm:w-[170px] lg:w-[190px] shrink-0"
        >
          <Image
            src="/nyota-logo-cream.png"
            alt="Nyota Springs"
            width={220}
            height={60}
            priority
            className="h-auto w-full object-contain"
          />
        </Link>
        <nav
          aria-label="Primary navigation"
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-white/20 bg-[#12251c]/55 px-2 py-1.5 text-xs text-white backdrop-blur-xl lg:flex"
        >
          {links.map((x) => (
            <a
              key={x.href}
              className="rounded-full px-5 py-2.5 transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              href={x.href}
            >
              {x.label}
            </a>
          ))}
        </nav>
        <a
          href="https://nyotasprings.com"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto hidden items-center gap-3 rounded-full bg-[#f5f0df] px-5 py-3 text-xs font-semibold text-[#23382d] transition hover:bg-white lg:inline-flex"
        >
          Visit Nyota Springs <ArrowUpRight size={17} />
        </a>
        <button
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white lg:hidden"
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-controls="mobile-navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="flex flex-col gap-1 border-t border-white/15 bg-[#1c2d26] px-5 pb-7 pt-3 text-white lg:hidden"
        >
          {links.map((x) => (
            <a
              key={x.href}
              href={x.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-base hover:bg-white/10"
            >
              {x.label}
            </a>
          ))}
          <a
            href="https://nyotasprings.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="mt-3 inline-flex items-center justify-between rounded-full bg-[#f5f0df] px-5 py-3 font-semibold text-[#23382d]"
          >
            Visit Nyota Springs <ArrowUpRight />
          </a>
        </nav>
      )}
    </header>
  );
}
