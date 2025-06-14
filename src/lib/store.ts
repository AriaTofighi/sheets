import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Store, Sheet } from "./types";
import { HyperFormula } from "hyperformula";

const DEFAULT_ROWS = 50;
const DEFAULT_COLS = 26;

const createNewSheet = (id: string, name: string): Sheet => {
  const grid = Array.from({ length: DEFAULT_ROWS }, () =>
    Array.from({ length: DEFAULT_COLS }, () => ({ value: "" }))
  );
  const data = grid.map((row) => row.map((cell) => cell.value));
  const hfInstance = HyperFormula.buildFromArray(data, {
    licenseKey: "gpl-v3",
  });

  return {
    id,
    name,
    grid,
    hfInstance,
  };
};

export const useStore = create(
  persist<Store>(
    (set) => {
      const defaultSheet = createNewSheet("sheet1", "Sheet 1");

      return {
        sheets: [defaultSheet],
        activeSheetId: defaultSheet.id,
        selectedCell: null,
        setSelectedCell: (sheetId, rowIndex, colIndex) =>
          set({ selectedCell: { sheetId, rowIndex, colIndex } }),
        updateCell: (sheetId, rowIndex, colIndex, value) =>
          set((state) => {
            const sheets = state.sheets.map((sheet) => {
              if (sheet.id === sheetId) {
                const newGrid = [...sheet.grid];
                const newRow = [...newGrid[rowIndex]];
                newRow[colIndex] = { ...newRow[colIndex], value };
                newGrid[rowIndex] = newRow;

                // Update HyperFormula instance
                sheet.hfInstance?.setCellContents(
                  { sheet: 0, col: colIndex, row: rowIndex },
                  [[value]]
                );

                return { ...sheet, grid: newGrid };
              }
              return sheet;
            });
            return { ...state, sheets };
          }),
      };
    },
    {
      name: "spreadsheet-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ...state,
        sheets: state.sheets.map((sheet) => {
          const { hfInstance, ...rest } = sheet;
          // hfInstance is intentionally unused to omit it from the persisted state
          void hfInstance;
          return rest;
        }),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.sheets.forEach((sheet) => {
            if (!sheet.hfInstance) {
              const data = sheet.grid.map((row) =>
                row.map((cell) => cell.value)
              );
              sheet.hfInstance = HyperFormula.buildFromArray(data, {
                licenseKey: "gpl-v3",
              });
            }
          });
        }
      },
    }
  )
);
