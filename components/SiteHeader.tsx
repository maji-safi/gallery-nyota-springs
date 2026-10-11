"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className={`ny-header${scrolled ? " ny-header--scrolled" : ""}`}>
      <div className="ny-header__inner">
        <Link href="/" className="ny-header__brand" aria-label="Nyota Springs Gallery — home" onClick={() => setOpen(false)}>
          <Image
            src="/nyota-logo-cream.png"
            alt="Nyota Springs"
            width={220}
            height={60}
            sizes="(max-width: 700px) 150px, 188px"
            className="ny-header__logo"
            priority
          />
        </Link>

        <nav className="ny-header__desktop-nav" aria-label="Main navigation">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="ny-header__nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <a
          className="ny-header__visit"
          href="https://nyotasprings.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit Nyota Springs <ArrowUpRight size={17} aria-hidden="true" />
        </a>

        <button
          type="button"
          className="ny-header__toggle"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="ny-mobile-menu"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <nav
        id="ny-mobile-menu"
        className={`ny-header__mobile-nav${open ? " ny-header__mobile-nav--open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!open}
        {...(!open ? { inert: true } : {})}
      >
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
        <a className="ny-header__mobile-visit" href="https://nyotasprings.com" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
          Visit Nyota Springs <ArrowUpRight size={18} aria-hidden="true" />
        </a>
      </nav>
    </header>
  );
}
