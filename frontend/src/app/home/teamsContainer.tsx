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
        // Enable drag if the inner content is wider than the container
        setIsDraggable(
          innerRef.current.scrollWidth > carouselRef.current.offsetWidth
        );
      }
    };

    checkDraggable();
    window.addEventListener("resize", checkDraggable);
    return () => window.removeEventListener("resize", checkDraggable);
  }, []);

  return (
    <div 
      ref={carouselRef} 
      className="w-full overflow-visible py-32 px-8 flex items-center"
    >
      {/* 3. The draggable inner track */}
      <motion.div
        ref={innerRef}
        drag={isDraggable ? "x" : false}
        dragConstraints={carouselRef} // Bounds the dragging to the outer container
        dragElastic={0.67} // Adds a nice bouncy feel when pulling past the edges
        className={`flex flex-row items-center justify-start gap-12 md:gap-20 lg:gap-28 w-max mx-auto ${
          isDraggable ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        {TEAM_MEMBERS.map((member, index) => (
          <div
            key={member.id}
            // Pointer events none prevents accidental image dragging from interfering with the container drag
            className={`shrink-0 pointer-events-none transition-transform duration-500 ${
              index % 2 === 0 ? "-translate-y-8 lg:-translate-y-12" : "translate-y-8 lg:translate-y-12"
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