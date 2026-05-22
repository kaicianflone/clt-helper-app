"use client";

import type { Day } from "~/components/day-tabs";
import { EulaModal, useEulaGate } from "~/components/EulaModal";
import { DealForm } from "./deal-form";

interface DealWrapperProps {
  slug: string;
  isNew: boolean;
  initialRestaurantName?: string;
  initialRestaurantAddress?: string;
  initialRestaurantLat?: number;
  initialRestaurantLng?: number;
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
  initialRestaurantLat,
  initialRestaurantLng,
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
          initialRestaurantLat={initialRestaurantLat}
          initialRestaurantLng={initialRestaurantLng}
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
