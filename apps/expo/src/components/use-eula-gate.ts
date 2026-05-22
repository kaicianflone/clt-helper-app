import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const EULA_KEY = "clt-eula-accepted-at";

export interface EulaGate {
  accepted: boolean;
  acceptedAt: string | null;
  accept: () => Promise<void>;
}

export function useEulaGate(): EulaGate {
  const [acceptedAt, setAcceptedAt] = useState<string | null>(null);

  useEffect(() => {
    void AsyncStorage.getItem(EULA_KEY).then((val) => {
      if (val) setAcceptedAt(val);
    });
  }, []);

  const accept = useCallback(async () => {
    const ts = new Date().toISOString();
    await AsyncStorage.setItem(EULA_KEY, ts);
    setAcceptedAt(ts);
  }, []);

  return {
    accepted: acceptedAt !== null,
    acceptedAt,
    accept,
  };
}
