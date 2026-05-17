"use client"; // Make sure this is a client component for Framer Motion

import { ProfileCard } from "@/components/profile-card";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const TEAM_MEMBERS = [
    {
      id: 1,
      name: "A. Wirasena",
      badge: "UI Sculptor",
      image: "/teams/Placeholder.png",
    },
    {
      id: 2,
      name: "A. Rian",
      badge: "Logic Lord",
      image: "/teams/Placeholder.png",
    },
    {
      id: 3,
      name: "A. Baraja",
      badge: "Flow Orchestrator",
      image: "/teams/Placeholder.png",
    },
    {
      id: 4,
      name: "C. Valentino",
      badge: "Bug Hunter",
      image: "/teams/Placeholder.png",
    },
    {
      id: 5,
      name: "R. Astarani",
      badge: "Data Dweller",
      image: "/teams/Placeholder.png",
    },
    {
      id: 6,
      name: "R. Astarani",
      badge: "Model Maker",
      image: "/teams/Placeholder.png",
    },
  ];

export default function TeamSection() {
  // 1. Create a reference for the outer boundary
  const carouselRef = useRef<HTMLDivElement>(null);
  // 2. Create a reference for the inner track to measure its size
  const innerRef = useRef<HTMLDivElement>(null);
  const [isDraggable, setIsDraggable] = useState(false);

  useEffect(() => {
    const checkDraggable = () => {
      if (carouselRef.current && innerRef.current) {
        // On mobile (less than 768px), enable drag if content is wider than container.
        if (window.innerWidth < 768) {
          setIsDraggable(innerRef.current.scrollWidth > carouselRef.current.offsetWidth);
        } else {
          setIsDraggable(false);
        }
      }
    };

    checkDraggable();
    window.addEventListener("resize", checkDraggable);
    return () => window.removeEventListener("resize", checkDraggable);
  }, []);

  return (
    <div 
      ref={carouselRef} 
      // Hidden overflow on mobile for cleaner drag edges, visible on desktop for grid and hover effects
      // Removed max-w on laptops so the 6 cards can stretch across the screen, reserving max-w only for 2xl
      className="overflow-hidden md:overflow-visible py-16 md:py-20 2xl:py-32 px-2 md:px-4 2xl:px-8 flex items-center justify-center w-full 2xl:max-w-[86vw] mx-auto"
    >
      {/* 3. The draggable inner track */}
      <motion.div
        ref={innerRef}
        drag={isDraggable ? "x" : false}
        dragConstraints={carouselRef} // Bounds the dragging to the outer container
        dragElastic={0.67} // Adds a nice bouncy feel when pulling past the edges
        // Reduced gaps slightly on laptops so the 6-column grid fits effortlessly side-by-side
        className={`flex flex-row md:grid md:grid-cols-6 items-center justify-start md:justify-items-center gap-6 md:gap-3 lg:gap-4 2xl:gap-8 w-max md:w-full mx-auto ${
          isDraggable ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        {TEAM_MEMBERS.map((member, index) => (
          <div
            key={member.id}
            // Retain staggered translation across both mobile drag and the 6-col desktop grid!
            className={`w-fit md:w-full shrink-0 transition-transform duration-500 ${
              index % 2 === 0 ? "-translate-y-4 md:-translate-y-6 2xl:-translate-y-10" : "translate-y-4 md:translate-y-6 2xl:translate-y-10"
            }`}
          >
            <ProfileCard
              name={member.name}
              badge={member.badge}
              image={member.image}
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}