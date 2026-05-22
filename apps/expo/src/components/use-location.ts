import { useState } from "react";
import * as Location from "expo-location";
import { PermissionStatus } from "expo-location";

export type LocationStatus = "idle" | "prompting" | "granted" | "denied";

export interface UseLocationResult {
  coords: [number, number] | null;
  status: LocationStatus;
  request: () => Promise<void>;
}

export function useLocation(): UseLocationResult {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");

  const request = async () => {
    setStatus("prompting");
    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== PermissionStatus.GRANTED) {
      setStatus("denied");
      return;
    }
    const pos = await Location.getCurrentPositionAsync({});
    setCoords([pos.coords.latitude, pos.coords.longitude]);
    setStatus("granted");
  };

  return { coords, status, request };
}
