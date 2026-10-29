import { useEffect, useState } from "react";

export function useDashboardTour() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const completed = localStorage.getItem("detailr_dashboard_tour_completed");
      if (!completed) {
        // Auto start tour for first-time user after 1s delay
        const timer = setTimeout(() => setIsOpen(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  const startTour = () => setIsOpen(true);
  const closeTour = () => setIsOpen(false);

  return { isOpen, startTour, closeTour };
}
