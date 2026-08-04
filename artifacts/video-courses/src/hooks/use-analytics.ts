import { useEffect } from "react";
import { useLocation } from "wouter";
import { useRecordVisit } from "@workspace/api-client-react";

export function useAnalytics() {
  const [location] = useLocation();
  const recordVisit = useRecordVisit();

  useEffect(() => {
    // Record visit once per session
    const hasVisited = sessionStorage.getItem("has_visited");
    if (!hasVisited) {
      recordVisit.mutateAsync().catch(() => {});
      sessionStorage.setItem("has_visited", "true");
    }
  }, []);
}
