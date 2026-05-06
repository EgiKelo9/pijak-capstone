"use client";

import Image from "next/image";
import { useState } from "react";

import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import CtaButton from "@/components/shadcn-space/button/button-01";

export default function NavbarDemo() {
  const navItems = [
    {
      name: (
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#2bc4ff]"></span>
          Home
        </span>
      ),
      link: "#home",
    },
    {
      name: "Tentang",
      link: "#about",
    },
    {
      name: "Fitur",
      link: "#features",
    },
    {
      name: "Penawaran",
      link: "#pricing",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          {/* Replaced NavbarLogo with your native SVG request */}
          <a href="/">
            <Image 
              src="./Logo.svg" 
              alt="BeeZ Logo" 
              width={96} 
              height={40} 
              className="h-7 w-auto object-contain"
            />
          </a>
          
          <NavItems items={navItems} />
          
          <div className="flex items-center gap-4">
            <CtaButton/>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <a href="/">
              <Image 
                src="/Logo.svg" 
                alt="BeeZ Logo" 
                width={64} 
                height={32} 
                className="h-5 w-auto object-contain"
              />
            </a>
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300 py-2"
              >
                {/* The JSX inside item.name renders perfectly here too! */}
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4 mt-4">
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full rounded-full bg-[#2bc4ff] hover:bg-[#1ca1e6] border-none text-white transition-colors"
              >
                Get Early Insights
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}