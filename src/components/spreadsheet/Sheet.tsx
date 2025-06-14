import { useStore } from "@/lib/store";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useEffect, useState } from "react";
import Cell from "./Cell";

const Sheet = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState<{
    colIndex: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  const activeSheet = useStore((s) =>
    s.sheets.find((sh) => sh.id === s.activeSheetId)
  );
  const { updateColumnWidth } = useStore();

  const rowCount = activeSheet?.grid.length ?? 0;
  const colCount = activeSheet?.grid[0]?.length ?? 0;

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => activeSheet?.rowHeights?.[index] ?? 35,
    overscan: 5,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: colCount,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => activeSheet?.columnWidths?.[index] ?? 100,
    overscan: 5,
  });

  useEffect(() => {
    // This is a workaround for a bug in tanstack/virtual where it doesn't always
    // update on size changes. This forces a re-render.
    columnVirtualizer.measure();
    rowVirtualizer.measure();
  }, [rowCount, colCount]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing || !activeSheet) return;

      const deltaX = e.clientX - resizing.startX;
      const newWidth = resizing.startWidth + deltaX;
      updateColumnWidth(activeSheet.id, resizing.colIndex, newWidth);
      columnVirtualizer.measure(); // Force remeasure
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    if (resizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [resizing, activeSheet, updateColumnWidth, columnVirtualizer]);

  const handleColumnResizeStart = (colIndex: number, startX: number) => {
    if (!activeSheet) return;
    setResizing({
      colIndex,
      startX,
      startWidth: activeSheet.columnWidths?.[colIndex] ?? 100,
    });
  };

  // Early return if no active sheet (after all hooks)
  if (!activeSheet) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select or create a sheet to get started.
      </div>
    );
  }

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
          className="absolute top-0 left-0 z-20 w-12 h-8 bg-gray-200 border-b border-r border-gray-300"
          style={{ width: 48, height: 32 }}
        />

        {/* Column Headers */}
        {columnVirtualizer.getVirtualItems().map((virtualColumn) => (
          <div
            key={virtualColumn.index}
            className="absolute top-0 left-0 bg-gray-200 border-r border-b border-gray-300 flex items-center justify-center font-bold group"
            style={{
              transform: `translateX(${virtualColumn.start + 48}px)`,
              height: 32,
              width: `${virtualColumn.size}px`,
            }}
          >
            {String.fromCharCode(65 + (virtualColumn.index % 26))}
            {/* Resize handle */}
            <div
              onMouseDown={(e) =>
                handleColumnResizeStart(virtualColumn.index, e.clientX)
              }
              className="absolute top-0 right-0 h-full w-1 cursor-col-resize bg-blue-500 opacity-0 group-hover:opacity-100"
            />
          </div>
        ))}

        {/* Row Headers */}
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            className="absolute left-0 top-0 bg-gray-200 border-r border-b border-gray-300 flex items-center justify-center font-bold"
            style={{
              transform: `translateY(${virtualRow.start + 32}px)`,
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
