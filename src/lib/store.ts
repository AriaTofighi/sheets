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
    columnWidths: Array.from({ length: DEFAULT_COLS }, () => 100),
    rowHeights: Array.from({ length: DEFAULT_ROWS }, () => 35),
  };
};

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const defaultSheet = createNewSheet("sheet1", "Sheet 1");

      return {
        sheets: [defaultSheet],
        activeSheetId: defaultSheet.id,
        activeSheetIndex: 0,
        selectedCell: null,
        editingCell: null,
        history: [],
        historyIndex: -1,
        addSheet: () =>
          set((state) => {
            const newSheetId = `sheet${state.sheets.length + 1}`;
            const newSheet = createNewSheet(
              newSheetId,
              `Sheet ${state.sheets.length + 1}`
            );
            return {
              ...state,
              sheets: [...state.sheets, newSheet],
              activeSheetId: newSheetId,
              activeSheetIndex: state.sheets.length,
            };
          }),
        setActiveSheetId: (sheetId: string) =>
          set((state) => ({
            ...state,
            activeSheetId: sheetId,
            activeSheetIndex: state.sheets.findIndex((s) => s.id === sheetId),
          })),
        setSelectedCell: (
          sheetId: string,
          rowIndex: number,
          colIndex: number
        ) =>
          set((state) => ({
            ...state,
            selectedCell: { sheetId, rowIndex, colIndex },
          })),
        setEditingCell: (
          sheetId: string | null,
          rowIndex: number | null,
          colIndex: number | null
        ) =>
          set((state) => {
            if (sheetId === null || rowIndex === null || colIndex === null) {
              return { ...state, editingCell: null };
            }
            return {
              ...state,
              editingCell: { sheetId, rowIndex, colIndex },
            };
          }),
        updateCell: (
          sheetId: string,
          rowIndex: number,
          colIndex: number,
          value: string
        ) =>
          set((state) => {
            const sheet = state.sheets.find((s) => s.id === sheetId);
            if (!sheet) return state;

            const oldValue = sheet.grid[rowIndex]?.[colIndex]?.value || "";

            // Don't add to history if value hasn't changed
            if (oldValue === value) return state;

            const sheets = state.sheets.map((sheet) => {
              if (sheet.id === sheetId) {
                const newGrid = [...sheet.grid];
                const newRow = [...newGrid[rowIndex]];
                newRow[colIndex] = { ...newRow[colIndex], value };
                newGrid[rowIndex] = newRow;

                sheet.hfInstance?.setCellContents(
                  {
                    sheet: 0,
                    col: colIndex,
                    row: rowIndex,
                  },
                  [[value]]
                );

                return { ...sheet, grid: newGrid };
              }
              return sheet;
            });

            // Add to history
            const historyEntry = {
              sheetId,
              rowIndex,
              colIndex,
              oldValue,
              newValue: value,
              timestamp: Date.now(),
            };

            // Remove any future history if we're not at the end
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(historyEntry);

            // Limit history to 100 entries
            if (newHistory.length > 100) {
              newHistory.shift();
            }

            return {
              ...state,
              sheets,
              history: newHistory,
              historyIndex: newHistory.length - 1,
            };
          }),
        updateColumnWidth: (sheetId: string, colIndex: number, width: number) =>
          set((state) => {
            const sheets = state.sheets.map((sheet) => {
              if (sheet.id === sheetId) {
                const newColumnWidths = [...(sheet.columnWidths ?? [])];
                newColumnWidths[colIndex] = Math.max(width, 20); // Minimum width
                return { ...sheet, columnWidths: newColumnWidths };
              }
              return sheet;
            });
            return { ...state, sheets };
          }),
        updateRowHeight: (sheetId: string, rowIndex: number, height: number) =>
          set((state) => {
            const sheets = state.sheets.map((sheet) => {
              if (sheet.id === sheetId) {
                const newRowHeights = [...(sheet.rowHeights ?? [])];
                newRowHeights[rowIndex] = Math.max(height, 20); // Minimum height
                return { ...sheet, rowHeights: newRowHeights };
              }
              return sheet;
            });
            return { ...state, sheets };
          }),
        exportToCSV: (sheetId: string) => {
          const state = get();
          const sheet = state.sheets.find((s) => s.id === sheetId);
          if (!sheet) return;

          // Find the last non-empty row and column
          let lastRow = 0;
          let lastCol = 0;
          for (let r = 0; r < sheet.grid.length; r++) {
            for (let c = 0; c < sheet.grid[r].length; c++) {
              if (sheet.grid[r][c].value.trim() !== "") {
                lastRow = Math.max(lastRow, r);
                lastCol = Math.max(lastCol, c);
              }
            }
          }

          // Convert to CSV
          const csvRows: string[] = [];
          for (let r = 0; r <= lastRow; r++) {
            const row: string[] = [];
            for (let c = 0; c <= lastCol; c++) {
              const value = sheet.grid[r]?.[c]?.value || "";
              // Escape quotes and wrap in quotes if contains comma, quote, or newline
              if (
                value.includes('"') ||
                value.includes(",") ||
                value.includes("\n")
              ) {
                row.push(`"${value.replace(/"/g, '""')}"`);
              } else {
                row.push(value);
              }
            }
            csvRows.push(row.join(","));
          }

          const csvContent = csvRows.join("\n");
          const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
          });
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", `${sheet.name}.csv`);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        },
        importFromCSV: (sheetId: string, csvData: string) =>
          set((state) => {
            const sheets = state.sheets.map((sheet) => {
              if (sheet.id === sheetId) {
                // Parse CSV data
                const rows = csvData.split("\n");
                const newGrid = [...sheet.grid];

                rows.forEach((row, rowIndex) => {
                  if (rowIndex >= newGrid.length) return;

                  // Simple CSV parsing (doesn't handle all edge cases)
                  const cells = row.split(",");
                  cells.forEach((cell, colIndex) => {
                    if (colIndex >= newGrid[rowIndex].length) return;

                    // Remove quotes if present
                    let value = cell.trim();
                    if (value.startsWith('"') && value.endsWith('"')) {
                      value = value.slice(1, -1).replace(/""/g, '"');
                    }

                    newGrid[rowIndex][colIndex] = { value };
                  });
                });

                // Update HyperFormula instance
                const data = newGrid.map((row) =>
                  row.map((cell) => cell.value)
                );
                sheet.hfInstance = HyperFormula.buildFromArray(data, {
                  licenseKey: "gpl-v3",
                });

                return { ...sheet, grid: newGrid };
              }
              return sheet;
            });
            return { ...state, sheets };
          }),
        clearSelectedCell: () =>
          set((state) => {
            if (state.selectedCell) {
              state.updateCell(
                state.selectedCell.sheetId,
                state.selectedCell.rowIndex,
                state.selectedCell.colIndex,
                ""
              );
            }
            return state;
          }),
        undo: () =>
          set((state) => {
            if (!state.canUndo()) {
              return state;
            }

            const entry = state.history[state.historyIndex];
            const sheets = state.sheets.map((sheet) => {
              if (sheet.id === entry.sheetId) {
                const newGrid = [...sheet.grid];
                const newRow = [...newGrid[entry.rowIndex]];
                newRow[entry.colIndex] = { value: entry.oldValue };
                newGrid[entry.rowIndex] = newRow;

                // Update HyperFormula instance
                sheet.hfInstance?.setCellContents(
                  {
                    sheet: 0,
                    col: entry.colIndex,
                    row: entry.rowIndex,
                  },
                  [[entry.oldValue]]
                );

                return { ...sheet, grid: newGrid };
              }
              return sheet;
            });

            return {
              ...state,
              sheets,
              historyIndex: state.historyIndex - 1,
            };
          }),
        redo: () =>
          set((state) => {
            if (state.historyIndex >= state.history.length - 1) return state;

            const entry = state.history[state.historyIndex + 1];
            const sheets = state.sheets.map((sheet) => {
              if (sheet.id === entry.sheetId) {
                const newGrid = [...sheet.grid];
                const newRow = [...newGrid[entry.rowIndex]];
                newRow[entry.colIndex] = { value: entry.newValue };
                newGrid[entry.rowIndex] = newRow;

                // Update HyperFormula instance
                sheet.hfInstance?.setCellContents(
                  {
                    sheet: 0,
                    col: entry.colIndex,
                    row: entry.rowIndex,
                  },
                  [[entry.newValue]]
                );

                return { ...sheet, grid: newGrid };
              }
              return sheet;
            });

            return {
              ...state,
              sheets,
              historyIndex: state.historyIndex + 1,
            };
          }),
        canUndo: (): boolean => {
          const state = get();
          return state.historyIndex >= 0;
        },
        canRedo: (): boolean => {
          const state = get();
          return state.historyIndex < state.history.length - 1;
        },
        renameSheet: (sheetId: string, newName: string) =>
          set((state) => ({
            ...state,
            sheets: state.sheets.map((sheet) =>
              sheet.id === sheetId ? { ...sheet, name: newName } : sheet
            ),
          })),
        deleteSheet: (sheetId: string) =>
          set((state) => {
            if (state.sheets.length <= 1) {
              return state; // Don't delete the last sheet
            }

            const sheetIndex = state.sheets.findIndex((s) => s.id === sheetId);
            if (sheetIndex === -1) {
              return state;
            }

            const newSheets = state.sheets.filter((s) => s.id !== sheetId);
            let newActiveSheetId = state.activeSheetId;

            if (state.activeSheetId === sheetId) {
              // If deleting the active sheet, switch to the previous one or the new first one
              newActiveSheetId =
                state.sheets[sheetIndex > 0 ? sheetIndex - 1 : 0]?.id;
              if (newActiveSheetId === sheetId) {
                // This case happens if we delete the first sheet
                newActiveSheetId = newSheets[0].id;
              }
            }
            const newActiveSheetIndex = newSheets.findIndex(
              (s) => s.id === newActiveSheetId
            );

            return {
              ...state,
              sheets: newSheets,
              activeSheetId: newActiveSheetId,
              activeSheetIndex: newActiveSheetIndex,
              selectedCell: null, // Clear selection
            };
          }),
        addRow: (sheetId, rowIndex) =>
          set((state) => {
            const sheets = state.sheets.map((sheet) => {
              if (sheet.id === sheetId) {
                const colCount = sheet.grid[0]?.length ?? 10;
                const newRow = Array(colCount)
                  .fill(null)
                  .map(() => ({ value: "" }));
                const newGrid = [...sheet.grid];
                newGrid.splice(rowIndex, 0, newRow);
                const sheetIndex = state.sheets.findIndex(
                  (s) => s.id === sheetId
                );
                sheet.hfInstance?.addRows(sheetIndex, [rowIndex, 1]);
                return { ...sheet, grid: newGrid };
              }
              return sheet;
            });
            return { ...state, sheets };
          }),
        removeRow: (sheetId, rowIndex) =>
          set((state) => {
            const sheets = state.sheets.map((sheet) => {
              if (sheet.id === sheetId && sheet.grid.length > 1) {
                const newGrid = sheet.grid.filter((_, i) => i !== rowIndex);
                const sheetIndex = state.sheets.findIndex(
                  (s) => s.id === sheetId
                );
                sheet.hfInstance?.removeRows(sheetIndex, [rowIndex, 1]);
                return { ...sheet, grid: newGrid };
              }
              return sheet;
            });
            return { ...state, sheets };
          }),
        addColumn: (sheetId, colIndex) =>
          set((state) => {
            const sheets = state.sheets.map((sheet) => {
              if (sheet.id === sheetId) {
                const newGrid = sheet.grid.map((row) => {
                  const newRow = [...row];
                  newRow.splice(colIndex, 0, { value: "" });
                  return newRow;
                });
                const sheetIndex = state.sheets.findIndex(
                  (s) => s.id === sheetId
                );
                sheet.hfInstance?.addColumns(sheetIndex, [colIndex, 1]);
                return { ...sheet, grid: newGrid };
              }
              return sheet;
            });
            return { ...state, sheets };
          }),
        removeColumn: (sheetId, colIndex) =>
          set((state) => {
            const sheets = state.sheets.map((sheet) => {
              if (sheet.id === sheetId && sheet.grid[0].length > 1) {
                const newGrid = sheet.grid.map((row) =>
                  row.filter((_, i) => i !== colIndex)
                );
                const sheetIndex = state.sheets.findIndex(
                  (s) => s.id === sheetId
                );
                sheet.hfInstance?.removeColumns(sheetIndex, [colIndex, 1]);
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { hfInstance, ...rest } = sheet;
          return rest;
        }),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.activeSheetId = state.sheets[0]?.id || null;
          state.activeSheetIndex = 0;
          state.sheets.forEach((sheet) => {
            // Ensure columnWidths and rowHeights exist
            if (!sheet.columnWidths) {
              sheet.columnWidths = Array.from(
                { length: DEFAULT_COLS },
                () => 100
              );
            }
            if (!sheet.rowHeights) {
              sheet.rowHeights = Array.from({ length: DEFAULT_ROWS }, () => 35);
            }

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
