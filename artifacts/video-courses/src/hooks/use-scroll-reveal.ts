import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * useScrollReveal
 *
 * Observes every element with the class "sr" and adds "sr-visible"
 * when ≥15% of the element enters the viewport.
 *
 * Usage in TSX (no JSX changes needed — add classes in HTML):
 *   <section className="sr sr-fade-up" data-sr-delay="200"> ... </section>
 *
 * Available direction modifiers:
 *   sr-fade-up | sr-fade-in | sr-fade-left | sr-fade-right | sr-scale
 *
 * Delay (data-sr-delay):  80 | 120 | 160 | 200 | 260 | 320 | 400 | 480 | 560
 */
export function useScrollReveal() {
  const [location] = useLocation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("sr-visible");
            // Once revealed, stop watching to save memory
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,      // trigger when 10% is visible
        rootMargin: "0px 0px -40px 0px", // slight bottom offset for natural feel
      }
    );

    // Observe all current .sr elements
    const attachObserver = () => {
      document.querySelectorAll(".sr:not(.sr-visible)").forEach((el) => {
        observer.observe(el);
      });
    };

    attachObserver();

    // Re-run after short delay to catch dynamically rendered elements
    const timer = setTimeout(attachObserver, 400);

    // Watch for new .sr elements added to DOM by async API sections
    // This fixes sections that only appear after API data loads
    const mutationObserver = new MutationObserver(() => {
      attachObserver();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      clearTimeout(timer);
    };
  }, [location]);
}
