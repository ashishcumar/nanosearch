import { createContext, useCallback, useContext, useState } from "react";

export type NaiveTelemetry = {
  searchLatencyMs: number;
  uiBlockTimeMs: number;
  scanned: number;
  matchCount: number;
};

export type SabTelemetry = {
  searchLatencyMs: number;
  uiBlockTimeMs: number; 
  scanned: number;
  matchCount: number;
};

type TelemetryState = {
  naive: NaiveTelemetry | null;
  sab: SabTelemetry | null;
};

type TelemetryContextValue = {
  telemetry: TelemetryState;
  setNaiveTelemetry: (t: NaiveTelemetry | null) => void;
  setSabTelemetry: (t: SabTelemetry | null) => void;
};

const defaultTelemetry: TelemetryState = { naive: null, sab: null };

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [telemetry, setTelemetry] = useState<TelemetryState>(defaultTelemetry);

  const setNaiveTelemetry = useCallback((t: NaiveTelemetry | null) => {
    setTelemetry((prev) => ({ ...prev, naive: t }));
  }, []);

  const setSabTelemetry = useCallback((t: SabTelemetry | null) => {
    setTelemetry((prev) => ({ ...prev, sab: t }));
  }, []);

  return (
    <TelemetryContext.Provider value={{ telemetry, setNaiveTelemetry, setSabTelemetry }}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error("useTelemetry must be used within TelemetryProvider");
  return ctx;
}
