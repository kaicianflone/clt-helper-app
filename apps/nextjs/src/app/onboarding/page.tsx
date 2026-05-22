"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ONBOARDING_KEY = "clt-onboarding-seen";

const STEPS = [
  {
    heading: "Welcome to Charlotte's open guide",
    body: "Greenways, deals, and parking — maintained by locals, for locals. Free forever.",
  },
  {
    heading: "Community-powered accuracy",
    body: 'Everything here was added or verified by Charlotte residents. See something wrong? Tap "Suggest an edit" on any page and it goes straight to a pull request.',
  },
  {
    heading: "Your privacy stays yours",
    body: "No accounts. No tracking. No ads. Contributions are public on GitHub, but there's no profile attached to you.",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const finish = () => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(ONBOARDING_KEY, "1");
    }
    router.replace("/");
  };

  const skip = () => finish();

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  };

  // Redirect if already seen (avoid flicker by doing this in useEffect)
  useEffect(() => {
    if (
      typeof localStorage !== "undefined" &&
      localStorage.getItem(ONBOARDING_KEY)
    ) {
      router.replace("/");
    }
  }, [router]);

  // step is always in-bounds via the clamp in next(); assert non-null for noUncheckedIndexedAccess
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const current = STEPS[step] ?? STEPS[0]!;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-[color:var(--bg-cream)] px-6 py-12">
      {/* Skip */}
      <div className="flex w-full max-w-md justify-end">
        <button
          onClick={skip}
          className="text-sm text-[color:var(--fg-ink-muted)] hover:text-[color:var(--fg-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="w-full max-w-md text-center">
        <div className="font-display text-6xl leading-none font-bold text-[color:var(--brick)]">
          clt
        </div>
        <h1 className="font-display mt-8 text-3xl font-bold tracking-tight text-[color:var(--fg-ink)]">
          {current.heading}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[color:var(--fg-ink-soft)]">
          {current.body}
        </p>
      </div>

      {/* Progress + CTA */}
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        {/* Dots */}
        <div className="flex gap-2" role="tablist" aria-label="Progress">
          {STEPS.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === step}
              aria-label={`Step ${i + 1}`}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === step
                  ? "w-6 bg-[color:var(--brick)]"
                  : "w-2 bg-[color:var(--border-soft)]"
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-full rounded-md bg-[color:var(--brick)] px-6 py-3 text-base font-medium text-white hover:bg-[color:var(--brick-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brick)]"
        >
          {isLast ? "Get started" : "Next"}
        </button>
      </div>
    </div>
  );
}
