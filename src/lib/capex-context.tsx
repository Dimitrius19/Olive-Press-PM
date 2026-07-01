// Shared construction-CAPEX state, lifted above the view switch so it persists across
// navigation and can drive more than one view. The Construction CAPEX page is the single
// source of truth for the elemental cost plan and its escalation / contingency / VAT
// build-up; the Ellinikon Villa (build-to-sell) model consumes the resulting base cost and
// wrappers, so editing a line item here flows straight through to that model's construction
// cost — and the two reconcile exactly by construction.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CAPEX_DEFAULTS,
  CAPEX_DEFAULT_LINE_ITEMS,
  runCapexModel,
  type CapexInputs,
  type CapexResult,
} from "./construction-capex-model";

interface CapexContextValue {
  inputs: CapexInputs;
  result: CapexResult;
  setGlobal: <K extends keyof CapexInputs>(field: K, value: CapexInputs[K]) => void;
  updateItem: (id: string, patch: Partial<{ name: string; cost: number }>) => void;
  addItem: (category: string) => void;
  removeItem: (id: string) => void;
  reset: () => void;
}

const CapexContext = createContext<CapexContextValue | null>(null);

// Fresh copy of the defaults (deep-copies the line items so edits never mutate the module
// constant, and a reset always returns to a clean plan).
function makeInitialInputs(): CapexInputs {
  return {
    ...CAPEX_DEFAULTS,
    lineItems: CAPEX_DEFAULT_LINE_ITEMS.map((it) => ({ ...it })),
  };
}

export function CapexProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputs] = useState<CapexInputs>(makeInitialInputs);

  const setGlobal = useCallback(
    <K extends keyof CapexInputs>(field: K, value: CapexInputs[K]) => {
      setInputs((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<{ name: string; cost: number }>) => {
      setInputs((prev) => ({
        ...prev,
        lineItems: prev.lineItems.map((it) =>
          it.id === id ? { ...it, ...patch } : it,
        ),
      }));
    },
    [],
  );

  const addItem = useCallback((category: string) => {
    setInputs((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          id: `custom-${Date.now()}-${Math.round(Math.random() * 1e4)}`,
          category,
          name: "New line item",
          cost: 0,
        },
      ],
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setInputs((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((it) => it.id !== id),
    }));
  }, []);

  const reset = useCallback(() => setInputs(makeInitialInputs()), []);

  const result = useMemo(() => runCapexModel(inputs), [inputs]);

  const value = useMemo<CapexContextValue>(
    () => ({ inputs, result, setGlobal, updateItem, addItem, removeItem, reset }),
    [inputs, result, setGlobal, updateItem, addItem, removeItem, reset],
  );

  return <CapexContext.Provider value={value}>{children}</CapexContext.Provider>;
}

export function useCapex(): CapexContextValue {
  const ctx = useContext(CapexContext);
  if (!ctx) {
    throw new Error("useCapex must be used within a CapexProvider");
  }
  return ctx;
}
