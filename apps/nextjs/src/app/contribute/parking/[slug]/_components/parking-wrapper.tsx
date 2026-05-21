"use client";

import { EulaModal, useEulaGate } from "~/components/EulaModal";
import { ParkingForm } from "./parking-form";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type HoursValue = { open: string; close: string } | "closed" | "24h";
type PaymentMethod = "cash" | "card" | "app" | "meter";

interface ParkingWrapperProps {
  slug: string;
  isNew: boolean;
  initialName?: string;
  initialAddress?: string;
  initialHourlyRate?: string;
  initialDailyMax?: string;
  initialHours?: Record<DayKey, HoursValue>;
  initialPaymentMethods?: PaymentMethod[];
  initialCovered?: boolean;
  initialOperator?: string;
}

export function ParkingWrapper({
  slug,
  isNew,
  initialName,
  initialAddress,
  initialHourlyRate,
  initialDailyMax,
  initialHours,
  initialPaymentMethods,
  initialCovered,
  initialOperator,
}: ParkingWrapperProps) {
  const { accepted, acceptedAt, accept } = useEulaGate();

  return (
    <>
      {!accepted && <EulaModal onAccept={accept} />}
      {accepted && acceptedAt && (
        <ParkingForm
          slug={slug}
          isNew={isNew}
          initialName={initialName}
          initialAddress={initialAddress}
          initialHourlyRate={initialHourlyRate}
          initialDailyMax={initialDailyMax}
          initialHours={initialHours}
          initialPaymentMethods={initialPaymentMethods}
          initialCovered={initialCovered}
          initialOperator={initialOperator}
          eulaAcceptedAt={acceptedAt}
        />
      )}
    </>
  );
}
