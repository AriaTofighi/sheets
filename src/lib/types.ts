import { HyperFormula } from "hyperformula";

export type Cell = {
  value: string;
};

export type Sheet = {
  id: string;
  name: string;
  grid: Cell[][];
  hfInstance?: HyperFormula;
};

export type Store = {
  sheets: Sheet[];
  activeSheetId: string | null;
  selectedCell: { sheetId: string; rowIndex: number; colIndex: number } | null;
  setSelectedCell: (
    sheetId: string,
    rowIndex: number,
    colIndex: number
  ) => void;
  updateCell: (
    sheetId: string,
    rowIndex: number,
    colIndex: number,
    value: string
  ) => void;
};
