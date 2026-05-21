import { motion, useAnimation } from 'motion/react';
import { useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

interface AnimatedLogoProps {
  className?: string;
  onClick?: () => void;
  variant?: 'white' | 'blue';
}

export function AnimatedLogo({ className, onClick, variant = 'blue' }: AnimatedLogoProps) {
  const controls = useAnimation();
  const exclamationControls = useAnimation();
  const isMountedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSlamAnimation = async () => {
    if (!isMountedRef.current) return;

    // 1. Exclamation mark jumps up
    try {
      await exclamationControls.start({
        y: -30,
        rotate: 10,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        transition: { duration: 0.25, ease: "easeOut" }
      });
    } catch (e) {
      // Catch animation cancellation
    }

    if (!isMountedRef.current) return;

    // 2. Exclamation mark smashes down
    try {
      exclamationControls.start({
        y: 0,
        rotate: 0,
        scale: 1,
        scaleY: [1, 0.5, 1.2, 1],
        scaleX: [1, 1.4, 0.9, 1],
        transition: { duration: 0.4, times: [0, 0.3, 0.6, 1] }
      });
    } catch (e) {}

    // 3. Word reacts to the impact shortly after the drop starts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      try {
        controls.start({
          y: [0, -8, 2, 0],
          x: [0, -2, 1, 0],
          rotate: [0, -3, 1, 0],
          transition: { duration: 0.5, times: [0, 0.2, 0.5, 1] }
        });
      } catch (e) {}
    }, 100);
  };

  useEffect(() => {
    isMountedRef.current = true;

    // 30 seconds loop
    const interval = setInterval(() => {
      triggerSlamAnimation();
    }, 30000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerSlamAnimation();
    onClick?.();
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center cursor-pointer select-none", 
        className
      )}
      onClick={handleClick}
    >
      <motion.span
        animate={controls}
        className={cn(
          "font-varela font-bold tracking-tight inline-block",
          variant === 'white' ? "text-white" : "text-pami-blue"
        )}
      >
        GuíaP
      </motion.span>
      <motion.span
        animate={exclamationControls}
        style={{ transformOrigin: "bottom center" }}
        className={cn(
          "font-varela font-bold tracking-tight inline-block",
          variant === 'white' ? "text-white" : "text-pami-blue"
        )}
      >
        !
      </motion.span>
      <sup className={cn(
        "font-bold -ml-[1px] mt-3 opacity-60 text-[0.35em]",
        variant === 'white' ? "text-white" : "text-pami-blue"
      )}>®</sup>
    </div>
  );
}
