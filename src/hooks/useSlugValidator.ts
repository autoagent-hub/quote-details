import { useState, useEffect } from "react";
import { checkSlugAvailability, type SlugValidationResult } from "@/lib/slug-validator";
import { slugify } from "@/lib/pricing";

export function useSlugValidator(rawSlug: string, currentUserId?: string | null, delayMs = 300) {
  const [status, setStatus] = useState<SlugValidationResult & { isChecking: boolean }>({
    cleanSlug: slugify(rawSlug),
    isValid: true,
    isTaken: false,
    isReserved: false,
    isCurrentOwner: false,
    suggestions: [],
    message: null,
    isChecking: false,
  });

  useEffect(() => {
    const clean = slugify(rawSlug);
    if (!clean) {
      setStatus({
        cleanSlug: "",
        isValid: false,
        isTaken: false,
        isReserved: false,
        isCurrentOwner: false,
        suggestions: [],
        message: "Please enter a URL slug.",
        isChecking: false,
      });
      return;
    }

    setStatus((prev) => ({ ...prev, cleanSlug: clean, isChecking: true }));

    let isSubscribed = true;
    const timer = setTimeout(() => {
      checkSlugAvailability(clean, currentUserId)
        .then((res) => {
          if (isSubscribed) {
            setStatus({
              ...res,
              isChecking: false,
            });
          }
        })
        .catch(() => {
          if (isSubscribed) {
            setStatus((prev) => ({ ...prev, isChecking: false }));
          }
        });
    }, delayMs);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [rawSlug, currentUserId, delayMs]);

  return status;
}
