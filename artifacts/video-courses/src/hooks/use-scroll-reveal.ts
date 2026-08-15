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
        const rect = el.getBoundingClientRect();
        // If element is already in viewport on mount, reveal it gracefully
        if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) {
          el.classList.add("sr-visible");
        } else {
          observer.observe(el);
        }
      });
    };

    attachObserver();

    // Re-run after short delays to catch async data loads & image layout shifts
    const t1 = setTimeout(attachObserver, 150);
    const t2 = setTimeout(attachObserver, 500);

    // Watch for new .sr elements added to DOM by async API sections
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
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [location]);
}
