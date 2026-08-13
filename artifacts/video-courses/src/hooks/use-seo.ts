import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: Record<string, any> | Record<string, any>[];
}

const BASE_TITLE = "Классный Фокус — Секреты Фокусов и Удивительные Трюки";
const BASE_URL = "https://xn----7sb1acdcpkxafxk9g.xn--p1ai"; // Punycode of классный-фокус.рф

export function useSEO({
  title,
  description,
  canonical,
  robots = "index, follow",
  ogTitle,
  ogDescription,
  ogImage,
  ogType = "website",
  twitterTitle,
  twitterDescription,
  twitterImage,
  structuredData,
}: SEOProps) {
  useEffect(() => {
    // 1. Set DOM Title
    const prevTitle = document.title;
    if (title) {
      document.title = `${title} | Классный Фокус`;
    } else {
      document.title = BASE_TITLE;
    }

    // Helper function to find or create head meta tags
    const setMetaTag = (attrName: string, attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (content) {
        if (!element) {
          element = document.createElement("meta");
          element.setAttribute(attrName, attrValue);
          document.head.appendChild(element);
        }
        element.setAttribute("content", content);
      } else if (element) {
        element.remove();
      }
    };

    // Save previous meta tags to restore on unmount if necessary
    const metaDescription = document.querySelector('meta[name="description"]');
    const prevDescription = metaDescription?.getAttribute("content") || "";
    const metaRobots = document.querySelector('meta[name="robots"]');
    const prevRobots = metaRobots?.getAttribute("content") || "index, follow";

    // 2. Set Meta Tags
    if (description) {
      setMetaTag("name", "description", description);
    }
    setMetaTag("name", "robots", robots);

    // Open Graph
    setMetaTag("property", "og:title", ogTitle || title || BASE_TITLE);
    setMetaTag("property", "og:description", ogDescription || description || "");
    setMetaTag("property", "og:type", ogType);
    if (ogImage) {
      setMetaTag("property", "og:image", ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`);
    }

    // Twitter / X
    setMetaTag("name", "twitter:title", twitterTitle || ogTitle || title || BASE_TITLE);
    setMetaTag("name", "twitter:description", twitterDescription || ogDescription || description || "");
    if (twitterImage || ogImage) {
      const img = twitterImage || ogImage;
      setMetaTag("name", "twitter:image", img && img.startsWith("http") ? img : `${BASE_URL}${img}`);
    }

    // 3. Set Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonicalLink?.getAttribute("href");
    const actualCanonical = canonical 
      ? (canonical.startsWith("http") ? canonical : `${BASE_URL}${canonical}`) 
      : `${BASE_URL}${window.location.pathname}`;

    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", actualCanonical);

    // 4. Inject JSON-LD Structured Data
    let scriptTag = document.getElementById("seo-structured-data");
    if (structuredData) {
      if (!scriptTag) {
        scriptTag = document.createElement("script");
        scriptTag.setAttribute("id", "seo-structured-data");
        scriptTag.setAttribute("type", "application/ld+json");
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(structuredData);
    } else if (scriptTag) {
      scriptTag.remove();
    }

    // Cleanup: restore previous meta values when route unmounts
    return () => {
      document.title = prevTitle;
      if (metaDescription) {
        if (prevDescription) {
          metaDescription.setAttribute("content", prevDescription);
        } else {
          metaDescription.removeAttribute("content");
        }
      }
      if (metaRobots) {
        metaRobots.setAttribute("content", prevRobots);
      }
      if (canonicalLink) {
        if (prevCanonical) {
          canonicalLink.setAttribute("href", prevCanonical);
        } else {
          canonicalLink.remove();
        }
      }
      const activeScript = document.getElementById("seo-structured-data");
      if (activeScript) {
        activeScript.remove();
      }
    };
  }, [
    title,
    description,
    canonical,
    robots,
    ogTitle,
    ogDescription,
    ogImage,
    ogType,
    twitterTitle,
    twitterDescription,
    twitterImage,
    structuredData,
  ]);
}
