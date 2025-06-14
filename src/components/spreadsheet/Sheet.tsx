import { useStore } from "@/lib/store";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useEffect } from "react";
import Cell from "./Cell";

const Sheet = () => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowCount = useStore(
    (s) => s.sheets.find((sh) => sh.id === s.activeSheetId)?.grid.length ?? 0
  );
  const colCount = useStore(
    (s) =>
      s.sheets.find((sh) => sh.id === s.activeSheetId)?.grid[0]?.length ?? 0
  );

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: colCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { selectedCell, activeSheetId, setSelectedCell } =
        useStore.getState();
      if (!selectedCell || !activeSheetId) return;

      let { rowIndex, colIndex } = selectedCell;

      switch (e.key) {
        case "ArrowUp":
          rowIndex = Math.max(0, rowIndex - 1);
          break;
        case "ArrowDown":
          rowIndex = Math.min(rowCount - 1, rowIndex + 1);
          break;
        case "ArrowLeft":
          colIndex = Math.max(0, colIndex - 1);
          break;
        case "ArrowRight":
          colIndex = Math.min(colCount - 1, colIndex + 1);
          break;
        default:
          return;
      }
      setSelectedCell(activeSheetId, rowIndex, colIndex);
    };

    const parent = parentRef.current;
    parent?.addEventListener("keydown", handleKeyDown);
    return () => {
      parent?.removeEventListener("keydown", handleKeyDown);
    };
  }, [rowCount, colCount]);

  const getColumnLabel = (index: number) => {
    let label = "";
    let temp = index;
    while (temp >= 0) {
      label = String.fromCharCode((temp % 26) + 65) + label;
      temp = Math.floor(temp / 26) - 1;
    }
    return label;
  };

  return (
    <div ref={parentRef} className="flex-1 overflow-auto relative" tabIndex={0}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: `${columnVirtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        {/* Corner */}
        <div
          className="sticky top-0 left-0 z-20 w-12 h-8 bg-gray-200 border-b border-r border-gray-300"
          style={{ width: 48, height: 32 }}
        />

        {/* Column Headers */}
        {columnVirtualizer.getVirtualItems().map((virtualColumn) => (
          <div
            key={virtualColumn.index}
            className="absolute top-0 bg-gray-200 border-r border-b border-gray-300 flex items-center justify-center font-bold"
            style={{
              transform: `translateX(${virtualColumn.start}px)`,
              left: 48,
              top: 0,
              height: 32,
              width: `${virtualColumn.size}px`,
            }}
          >
            {getColumnLabel(virtualColumn.index)}
          </div>
        ))}

        {/* Row Headers */}
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            className="absolute left-0 bg-gray-200 border-r border-b border-gray-300 flex items-center justify-center font-bold"
            style={{
              transform: `translateY(${virtualRow.start}px)`,
              top: 32,
              left: 0,
              width: 48,
              height: `${virtualRow.size}px`,
            }}
          >
            {virtualRow.index + 1}
          </div>
        ))}

        {/* Grid Cells */}
        <div
          style={{
            position: "absolute",
            top: 32,
            left: 48,
            width: `${columnVirtualizer.getTotalSize()}px`,
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) =>
            columnVirtualizer.getVirtualItems().map((virtualColumn) => (
              <div
                key={`${virtualRow.index}-${virtualColumn.index}`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  transform: `translateX(${virtualColumn.start}px) translateY(${virtualRow.start}px)`,
                  height: `${virtualRow.size}px`,
                  width: `${virtualColumn.size}px`,
                }}
              >
                <Cell
                  rowIndex={virtualRow.index}
                  colIndex={virtualColumn.index}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Sheet;
