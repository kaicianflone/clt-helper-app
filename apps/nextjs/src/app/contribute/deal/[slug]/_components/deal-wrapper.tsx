"use client";

import { EulaModal, useEulaGate } from "~/components/EulaModal";
import { DealForm } from "./deal-form";
import type { Day } from "~/components/day-tabs";

interface DealWrapperProps {
  slug: string;
  isNew: boolean;
  initialRestaurantName?: string;
  initialRestaurantAddress?: string;
  initialDealDescription?: string;
  initialDaysOfWeek?: Day[];
  initialAllDay?: boolean;
  initialTimeStart?: string;
  initialTimeEnd?: string;
  initialLink?: string;
}

export function DealWrapper({
  slug,
  isNew,
  initialRestaurantName,
  initialRestaurantAddress,
  initialDealDescription,
  initialDaysOfWeek,
  initialAllDay,
  initialTimeStart,
  initialTimeEnd,
  initialLink,
}: DealWrapperProps) {
  const { accepted, acceptedAt, accept } = useEulaGate();

  return (
    <>
      {!accepted && <EulaModal onAccept={accept} />}
      {accepted && acceptedAt && (
        <DealForm
          slug={slug}
          isNew={isNew}
          initialRestaurantName={initialRestaurantName}
          initialRestaurantAddress={initialRestaurantAddress}
          initialDealDescription={initialDealDescription}
          initialDaysOfWeek={initialDaysOfWeek}
          initialAllDay={initialAllDay}
          initialTimeStart={initialTimeStart}
          initialTimeEnd={initialTimeEnd}
          initialLink={initialLink}
          eulaAcceptedAt={acceptedAt}
        />
      )}
    </>
  );
}
