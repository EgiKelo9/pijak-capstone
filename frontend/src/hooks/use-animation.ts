import { useEffect, useState } from "react";

/**
 * A custom hook to animate frames by periodically incrementing a counter.
 * Accepts either FPS (frames per second) as a number, or an object specifying the interval in milliseconds.
 */
export function useAnimation(
  config: number | { intervalMs: number }
): number {
  const [frame, setFrame] = useState(0);

  const intervalMs =
    typeof config === "number" ? 1000 / config : config.intervalMs;

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => f + 1);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return frame;
}
