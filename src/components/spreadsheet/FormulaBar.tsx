import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FormulaBar = () => {
  const { selectedCell, sheets, updateCell } = useStore();

  const sheet = selectedCell
    ? sheets.find((s) => s.id === selectedCell.sheetId)
    : null;

  const cell =
    sheet && selectedCell
      ? sheet.grid[selectedCell.rowIndex]?.[selectedCell.colIndex]
      : null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedCell) {
      updateCell(
        selectedCell.sheetId,
        selectedCell.rowIndex,
        selectedCell.colIndex,
        e.target.value
      );
    }
  };

  const getColumnLabel = (index: number) => {
    let label = "";
    let temp = index;
    while (temp >= 0) {
      label = String.fromCharCode((temp % 26) + 65) + label;
      temp = Math.floor(temp / 26) - 1;
    }
    return label;
  };

  const cellLabel = selectedCell
    ? `${getColumnLabel(selectedCell.colIndex)}${selectedCell.rowIndex + 1}`
    : "";

  return (
    <div className="flex items-center">
      <div
        className={cn(
          "w-20 text-center text-sm font-bold border-r border-gray-300 py-2",
          !cellLabel && "text-gray-400"
        )}
      >
        {cellLabel || "FX"}
      </div>
      <Input
        value={cell?.value || ""}
        onChange={handleInputChange}
        className="flex-1 h-full rounded-none border-none focus-visible:ring-0"
        placeholder="Enter value or formula..."
      />
    </div>
  );
};

export default FormulaBar;
