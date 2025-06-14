import { HyperFormula } from "hyperformula";
import type { Sheet } from "./types";

export const createFormulaParser = (sheet: Sheet) => {
  const data = sheet.grid.map((row) => row.map((cell) => cell.value));
  const hf = HyperFormula.buildFromArray(data, { licenseKey: "gpl-v3" });
  return hf;
};
