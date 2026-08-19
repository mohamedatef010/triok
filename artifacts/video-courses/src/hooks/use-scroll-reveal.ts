import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * useScrollReveal
 *
 * Observes elements with the class "sr" and adds "sr-visible"
 * smoothly and proactively on both mobile and desktop.
 */
export function useScrollReveal() {
  const [location] = useLocation();

  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

    if (isMobile) {
      document.querySelectorAll(".sr").forEach((el) => el.classList.add("sr-visible"));
      return;
    }

    // Eager margin on top/bottom so elements reveal just before scrolling into view on desktop/tablet
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("sr-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.02,
        rootMargin: "80px 0px 80px 0px",
      }
    );

    // Observe unobserved .sr elements directly without forced layout reflows
    const attachObserver = () => {
      const elements = document.querySelectorAll(".sr:not(.sr-visible)");
      elements.forEach((el) => {
        observer.observe(el);
      });
    };

    attachObserver();

    // Re-check for elements loaded asynchronously
    const t1 = setTimeout(attachObserver, 100);
    const t2 = setTimeout(attachObserver, 400);

    // Fail-safe: Ensure all elements are visible after page settles so no content is ever missed
    const tFallback = setTimeout(() => {
      document.querySelectorAll(".sr:not(.sr-visible)").forEach((el) => {
        el.classList.add("sr-visible");
      });
    }, 1200);

    // Watch for new .sr elements added dynamically without calling getBoundingClientRect
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const mutationObserver = new MutationObserver(() => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(attachObserver, 60);
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(tFallback);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [location]);
}

