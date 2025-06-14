import { memo, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Sheet } from "@/lib/types";
import { CellError } from "hyperformula";

type CellProps = {
  rowIndex: number;
  colIndex: number;
};

const selectHfInstance = (state: {
  sheets: Sheet[];
  activeSheetId: string | null;
}) => state.sheets.find((s) => s.id === state.activeSheetId)?.hfInstance;

const Cell = ({ rowIndex, colIndex }: CellProps) => {
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
  const isEditing = useStore(
    (state) =>
      state.editingCell?.sheetId === state.activeSheetId &&
      state.editingCell?.rowIndex === rowIndex &&
      state.editingCell?.colIndex === colIndex
  );
  const activeSheetId = useStore((state) => state.activeSheetId);
  const hfInstance = useStore(selectHfInstance);

  const { updateCell, setSelectedCell, setEditingCell } = useStore.getState();

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
      setEditingCell(null, null, null);
    }
  };

  const handleDoubleClick = () => {
    if (activeSheetId) {
      setEditingCell(activeSheetId, rowIndex, colIndex);
    }
  };

  const handleBlur = () => {
    setEditingCell(null, null, null);
  };

  let displayValue = value;
  if (value.startsWith("=") && hfInstance) {
    const cellValue = hfInstance.getCellValue({
      sheet: 0,
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
        "w-full h-full border-r border-b flex items-center justify-start px-1",
        {
          "ring-2 ring-ring z-10": isSelected,
          "bg-accent": isSelected && !isEditing,
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
