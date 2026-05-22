"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ONBOARDING_KEY = "clt-onboarding-seen";

/** Renders nothing — fires a one-time redirect to /onboarding on first visit. */
export function OnboardingRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (
      typeof localStorage !== "undefined" &&
      !localStorage.getItem(ONBOARDING_KEY)
    ) {
      router.replace("/onboarding");
    }
  }, [router]);

  return null;
}
