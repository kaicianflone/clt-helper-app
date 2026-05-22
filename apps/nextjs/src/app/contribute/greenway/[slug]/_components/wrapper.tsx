"use client";

import { EulaModal, useEulaGate } from "~/components/EulaModal";
import { GreenwayForm } from "./form";

interface ContributeWrapperProps {
  slug: string;
  initialName: string;
  initialLengthMiles: number;
  initialDescription: string;
  initialSurface: "paved" | "natural" | "mixed";
  verifyOnly?: boolean;
}

export function ContributeWrapper({
  slug,
  initialName,
  initialLengthMiles,
  initialDescription,
  initialSurface,
  verifyOnly = false,
}: ContributeWrapperProps) {
  const { accepted, acceptedAt, accept } = useEulaGate();

  return (
    <>
      {!accepted && <EulaModal onAccept={accept} />}
      {accepted && acceptedAt && (
        <GreenwayForm
          slug={slug}
          initialName={initialName}
          initialLengthMiles={initialLengthMiles}
          initialDescription={initialDescription}
          initialSurface={initialSurface}
          eulaAcceptedAt={acceptedAt}
          verifyOnly={verifyOnly}
        />
      )}
    </>
  );
}
