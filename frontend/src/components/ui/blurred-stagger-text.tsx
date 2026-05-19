"use client" 

 
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
 
export const BlurredStagger = ({
  text = "we love hextaui.com ❤️",
  mode = "paragraph",
  className,
}: {
  text: string;
  mode?: "sentence" | "paragraph";
  className?: string;
}) => {
  const headingText = text;
 
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
      ? "text-3xl md:text-5xl font-bold tracking-tight" 
      : "text-base md:text-xl font-light leading-relaxed";

  return (
    <>
      <div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, margin: "-50px" }}
          className={cn(modeClasses, className)}
        >
          {headingText.split("").map((char, index) => (
            <motion.span
              key={index}
              variants={letterAnimation}
              transition={{ duration: 0.3 }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </>
  );
};