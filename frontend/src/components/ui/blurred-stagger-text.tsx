"use client" 

 
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import React from "react";
 
export const BlurredStagger = ({
  text = "we love hextaui.com ❤️",
  mode = "paragraph",
  className,
}: {
  text: string;
  mode?: "sentence" | "paragraph";
  className?: string;
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.015,
      },
    },
  };
 
  const letterAnimation = {
    hidden: {
      opacity: 0,
      filter: "blur(10px)",
    },
    show: {
      opacity: 1,
      filter: "blur(0px)",
    },
  };
 
  const modeClasses = 
    mode === "sentence" 
      ? "text-2xl md:text-3xl 2xl:text-5xl font-bold tracking-tight" 
      : "text-sm md:text-md 2xl:text-xl font-light leading-relaxed";

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: false, margin: "-50px" }}
      className={cn(modeClasses, className)}
    >
      {/* Split by word first, keeping words together in an inline-block */}
      {text.split(" ").map((word, wordIndex, array) => (
        <React.Fragment key={wordIndex}>
          <span className="inline-block whitespace-nowrap">
            {word.split("").map((char, charIndex) => (
              <motion.span
                key={charIndex}
                variants={letterAnimation}
                transition={{ duration: 0.3 }}
              >
                {char}
              </motion.span>
            ))}
          </span>
          {/* Add a standard wrapping space between words, but not after the last word */}
          {wordIndex < array.length - 1 && " "}
        </React.Fragment>
      ))}
    </motion.div>
  );
};