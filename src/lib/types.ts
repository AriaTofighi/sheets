import type { HyperFormula } from "hyperformula";

export type Cell = {
  value: string;
};

export type Sheet = {
  id: string;
  name: string;
  grid: Cell[][];
  hfInstance: HyperFormula | null;
  columnWidths: number[];
  rowHeights: number[];
};

export type HistoryEntry = {
  sheetId: string;
  rowIndex: number;
  colIndex: number;
  oldValue: string;
  newValue: string;
  timestamp: number;
};

export type Store = {
  sheets: Sheet[];
  activeSheetId: string | null;
  activeSheetIndex: number;
  selectedCell: { sheetId: string; rowIndex: number; colIndex: number } | null;
  editingCell: { sheetId: string; rowIndex: number; colIndex: number } | null;
  history: HistoryEntry[];
  historyIndex: number;
  addSheet: () => void;
  renameSheet: (sheetId: string, newName: string) => void;
  deleteSheet: (sheetId: string) => void;
  setActiveSheetId: (sheetId: string) => void;
  setSelectedCell: (
    sheetId: string,
    rowIndex: number,
    colIndex: number
  ) => void;
  setEditingCell: (
    sheetId: string | null,
    rowIndex: number | null,
    colIndex: number | null
  ) => void;
  updateCell: (
    sheetId: string,
    rowIndex: number,
    colIndex: number,
    value: string
  ) => void;
  updateColumnWidth: (sheetId: string, colIndex: number, width: number) => void;
  updateRowHeight: (sheetId: string, rowIndex: number, height: number) => void;
  addRow: (sheetId: string, rowIndex: number) => void;
  removeRow: (sheetId: string, rowIndex: number) => void;
  addColumn: (sheetId: string, colIndex: number) => void;
  removeColumn: (sheetId: string, colIndex: number) => void;
  clearSelectedCell: () => void;
  exportToCSV: (sheetId: string) => void;
  importFromCSV: (sheetId: string, csvData: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
};
