import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// 1. PageTransition wrapper
export const PageTransition = ({ children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

// 2. FadeIn wrapper
export const FadeIn = ({ children, delay = 0, duration = 0.4, className = '' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

// 3. SlideUp wrapper
export const SlideUp = ({ children, delay = 0, distance = 24, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: distance }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

// 4. ScaleIn wrapper
export const ScaleIn = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.94 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.35, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

// 5. StaggerContainer and StaggerItem
export const StaggerContainer = ({ children, staggerDelay = 0.08, className = '' }) => (
  <motion.div
    initial="hidden"
    animate="show"
    variants={{
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay
        }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className = '' }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// 6. HoverCard wrapper with smooth micro-lift
export const HoverCard = ({ children, className = '', onClick }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    onClick={onClick}
    className={className}
  >
    {children}
  </motion.div>
);

// 7. AnimatedCounter for statistical metrics
export const AnimatedCounter = ({ target, duration = 1.2, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const finalValue = Number(target) || 0;
    if (finalValue === 0) {
      setCount(0);
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      setCount(Math.floor(easedProgress * finalValue));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(finalValue);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [target, duration]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

export { motion, AnimatePresence };
