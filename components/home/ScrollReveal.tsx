"use client";

import { useEffect, useRef, type ReactNode } from "react";

const TARGETS = [
  "#featured-fleet h2",
  "#featured-fleet article",
  ".arrival-copy",
  ".arrival-photo",
  ".booking-confidence-heading",
  ".booking-journey li",
  ".booking-benefits-list > div",
  ".office-heading",
  ".office-stage",
].join(",");

export default function ScrollReveal({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new WeakSet<Element>();
    const animations = new Map<Element, Animation>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (preference.matches || entry.target.contains(document.activeElement)) continue;
        const animation = entry.target.animate(
          [{ opacity: 0.55, transform: "translateY(16px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 550, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
        animations.set(entry.target, animation);
        animation.onfinish = () => animations.delete(entry.target);
      }
    }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });

    const register = (scope: Element) => {
      const elements = [...(scope.matches(TARGETS) ? [scope] : []), ...scope.querySelectorAll(TARGETS)];
      for (const element of elements) {
        if (seen.has(element)) continue;
        seen.add(element);
        // Already-visible content and anchor destinations never flash on hydration.
        if (element.getBoundingClientRect().top < window.innerHeight || preference.matches) continue;
        observer.observe(element);
      }
    };
    register(root);
    // Fleet cards arrive asynchronously; observe only newly inserted subtrees.
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) if (node instanceof Element) register(node);
      }
    });
    mutations.observe(root, { childList: true, subtree: true });
    const cancelAnimations = () => {
      for (const animation of animations.values()) animation.cancel();
      animations.clear();
    };
    const onPreference = () => {
      if (preference.matches) { observer.disconnect(); cancelAnimations(); }
    };
    const onFocus = (event: FocusEvent) => {
      for (const [element, animation] of animations) {
        if (event.target instanceof Node && element.contains(event.target)) {
          animation.cancel(); animations.delete(element);
        }
      }
    };
    preference.addEventListener("change", onPreference);
    root.addEventListener("focusin", onFocus);
    return () => {
      observer.disconnect(); mutations.disconnect(); cancelAnimations();
      preference.removeEventListener("change", onPreference);
      root.removeEventListener("focusin", onFocus);
    };
  }, []);

  return <div ref={rootRef} className="flex flex-col w-full">{children}</div>;
}
