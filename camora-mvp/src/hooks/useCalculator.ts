"use client";

import { useState, useCallback, useMemo } from "react";
import { calculate } from "@/lib/engine";
import type { SystemResult, CameraConfig } from "@/lib/engine";
import type { CameraRow, CalculatorFormState } from "@/types/calculator";
import { DEFAULT_CAMERA_CONFIG } from "@/lib/constants";

export function generateRowId(): string {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeDefaultRow(): CameraRow {
  return {
    ...DEFAULT_CAMERA_CONFIG,
    id:     generateRowId(),
    _rowId: generateRowId(),
  };
}

interface UseCalculatorReturn {
  state:                 CalculatorFormState;
  result:                SystemResult | null;
  error:                 string | null;
  addRow:                () => void;
  removeRow:             (rowId: string) => void;
  updateRow:             (rowId: string, patch: Partial<CameraConfig>) => void;
  duplicateRow:          (rowId: string) => void;
  setConservativeMode:   (v: boolean) => void;
  setOverheadMultiplier: (v: number) => void;
}

export function useCalculator(): UseCalculatorReturn {
  const [state, setState] = useState<CalculatorFormState>({
    rows:                     [makeDefaultRow()],
    conservativeMode:          false,
    storageOverheadMultiplier: 1.20,
  });

  const { result, error } = useMemo(() => {
    try {
      const r = calculate(state.rows, {
        conservativeMode:          state.conservativeMode,
        storageOverheadMultiplier: state.storageOverheadMultiplier,
      });
      return { result: r, error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [state]);

  const addRow = useCallback(() => {
    setState((prev) => ({ ...prev, rows: [...prev.rows, makeDefaultRow()] }));
  }, []);

  const removeRow = useCallback((rowId: string) => {
    setState((prev) => ({ ...prev, rows: prev.rows.filter((r) => r._rowId !== rowId) }));
  }, []);

  const updateRow = useCallback((rowId: string, patch: Partial<CameraConfig>) => {
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => row._rowId === rowId ? { ...row, ...patch } : row),
    }));
  }, []);

  const duplicateRow = useCallback((rowId: string) => {
    setState((prev) => {
      const source = prev.rows.find((r) => r._rowId === rowId);
      if (!source) return prev;
      const newRow: CameraRow = { ...source, id: generateRowId(), _rowId: generateRowId() };
      const idx  = prev.rows.findIndex((r) => r._rowId === rowId);
      const rows = [...prev.rows];
      rows.splice(idx + 1, 0, newRow);
      return { ...prev, rows };
    });
  }, []);

  const setConservativeMode = useCallback((v: boolean) => {
    setState((prev) => ({ ...prev, conservativeMode: v }));
  }, []);

  const setOverheadMultiplier = useCallback((v: number) => {
    setState((prev) => ({ ...prev, storageOverheadMultiplier: v }));
  }, []);

  return { state, result, error, addRow, removeRow, updateRow, duplicateRow, setConservativeMode, setOverheadMultiplier };
}
