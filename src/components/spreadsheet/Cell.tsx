import { memo, useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Sheet, Store } from "@/lib/types";
import { CellError } from "hyperformula";

type CellProps = {
  rowIndex: number;
  colIndex: number;
};

const selectHfInstance = (state: {
  sheets: Sheet[];
  activeSheetId: string | null;
}) => state.sheets.find((s) => s.id === state.activeSheetId)?.hfInstance;

const selectActiveSheetIndex = (state: Store) => state.activeSheetIndex;

const Cell = ({ rowIndex, colIndex }: CellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const value =
    useStore(
      (state) =>
        state.sheets.find((s) => s.id === state.activeSheetId)?.grid[
          rowIndex
        ]?.[colIndex]?.value
    ) ?? "";

  const isSelected = useStore(
    (state) =>
      state.selectedCell?.sheetId === state.activeSheetId &&
      state.selectedCell?.rowIndex === rowIndex &&
      state.selectedCell?.colIndex === colIndex
  );
  const activeSheetId = useStore((state) => state.activeSheetId);
  const activeSheetIndex = useStore(selectActiveSheetIndex);
  const hfInstance = useStore(selectHfInstance);

  const { updateCell, setSelectedCell } = useStore.getState();

  useEffect(() => {
    if (!isSelected) {
      setIsEditing(false);
    }
  }, [isSelected]);

  useEffect(() => {
    if (isSelected && isEditing) {
      inputRef.current?.focus();
    }
  }, [isSelected, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeSheetId) {
      updateCell(activeSheetId, rowIndex, colIndex, e.target.value);
    }
  };

  const handleClick = () => {
    if (activeSheetId) {
      setSelectedCell(activeSheetId, rowIndex, colIndex);
    }
  };

  const handleDoubleClick = () => {
    if (activeSheetId) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  let displayValue = value;
  if (value.startsWith("=") && hfInstance) {
    const cellValue = hfInstance.getCellValue({
      sheet: activeSheetIndex,
      col: colIndex,
      row: rowIndex,
    });
    if (cellValue instanceof CellError) {
      displayValue = cellValue.type;
    } else {
      displayValue = String(cellValue ?? "");
    }
  }

  return (
    <div
      className={cn(
        "w-full h-full border-r border-b border-gray-300 flex items-center justify-start px-1",
        {
          "ring-2 ring-blue-500 z-10": isSelected,
          "bg-blue-50": isSelected && !isEditing,
        }
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing && isSelected ? (
        <input
          ref={inputRef}
          type="text"
          value={value || ""}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className="w-full h-full outline-none bg-transparent"
        />
      ) : (
        <div className="w-full h-full truncate">{displayValue}</div>
      )}
    </div>
  );
};

export default memo(Cell);
