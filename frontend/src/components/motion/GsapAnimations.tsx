import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ReactNode } from "react";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  distance?: number;
}

export function ScrollReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.8,
  distance = 40,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const scrollParent = el.closest("main") || window;

    const fromVars: gsap.TweenVars = {
      opacity: 0,
      duration,
      delay,
      ease: "power3.out",
    };

    switch (direction) {
      case "up":
        fromVars.y = distance;
        break;
      case "down":
        fromVars.y = -distance;
        break;
      case "left":
        fromVars.x = distance;
        break;
      case "right":
        fromVars.x = -distance;
        break;
    }

    gsap.from(el, {
      ...fromVars,
      scrollTrigger: {
        trigger: el,
        scroller: scrollParent,
        start: "top 100%",
        toggleActions: "play none none none",
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [direction, delay, duration, distance]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Animated number counter using GSAP
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  className,
  suffix = "",
  decimals = 0,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obj = { val: prevValue.current };
    gsap.to(obj, {
      val: value,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = obj.val.toFixed(decimals) + suffix;
      },
    });

    prevValue.current = value;
  }, [value, duration, suffix, decimals]);

  return (
    <span ref={ref} className={className}>
      {value.toFixed(decimals)}{suffix}
    </span>
  );
}

// GSAP stagger hook — returns a ref to attach to a container element
export function useGsapStagger<T extends HTMLElement>(stagger = 0.08) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const items = el.children;
    if (items.length === 0) return;

    gsap.from(items, {
      opacity: 0,
      y: 24,
      stagger,
      duration: 0.6,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        scroller: el.closest("main") || window,
        start: "top 100%",
        toggleActions: "play none none none",
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [stagger]);

  return ref;
}

// Stagger children with GSAP (scroll-triggered) — div wrapper version
interface GsapStaggerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
}

export function GsapStagger({
  children,
  className,
  stagger = 0.08,
}: GsapStaggerProps) {
  const ref = useGsapStagger<HTMLDivElement>(stagger);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Parallax float effect
interface ParallaxFloatProps {
  children: ReactNode;
  className?: string;
  speed?: number;
}

export function ParallaxFloat({
  children,
  className,
  speed = 50,
}: ParallaxFloatProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.to(el, {
      y: -speed,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        scroller: el.closest("main") || window,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [speed]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
