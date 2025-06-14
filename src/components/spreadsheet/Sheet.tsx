import { useStore } from "@/lib/store";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useEffect, useState } from "react";
import Cell from "./Cell";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

const Sheet = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState<{
    type: "col" | "row";
    index: number;
    startPos: number;
    startSize: number;
  } | null>(null);

  const activeSheet = useStore((s) =>
    s.sheets.find((sh) => sh.id === s.activeSheetId)
  );
  const {
    updateColumnWidth,
    updateRowHeight,
    addColumn,
    removeColumn,
    addRow,
    removeRow,
    selectedCell,
    setSelectedCell,
    clearSelectedCell,
  } = useStore();

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

      if (resizing.type === "col") {
        const deltaX = e.clientX - resizing.startPos;
        const newWidth = resizing.startSize + deltaX;
        updateColumnWidth(activeSheet.id, resizing.index, newWidth);
        columnVirtualizer.measure();
      } else {
        const deltaY = e.clientY - resizing.startPos;
        const newHeight = resizing.startSize + deltaY;
        updateRowHeight(activeSheet.id, resizing.index, newHeight);
        rowVirtualizer.measure();
      }
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
  }, [
    resizing,
    activeSheet,
    updateColumnWidth,
    updateRowHeight,
    columnVirtualizer,
    rowVirtualizer,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;
      // Check if the event target is an input, textarea, or contenteditable element
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return; // Don't interfere with typing
      }

      let newRowIndex = selectedCell.rowIndex;
      let newColIndex = selectedCell.colIndex;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          newRowIndex = Math.max(0, selectedCell.rowIndex - 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          newRowIndex = Math.min(rowCount - 1, selectedCell.rowIndex + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          newColIndex = Math.max(0, selectedCell.colIndex - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          newColIndex = Math.min(colCount - 1, selectedCell.colIndex + 1);
          break;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          clearSelectedCell();
          return; // No need to set selected cell again
        default:
          return;
      }

      setSelectedCell(activeSheet!.id, newRowIndex, newColIndex);
    };

    const parent = parentRef.current;
    if (parent) {
      parent.addEventListener("keydown", handleKeyDown);
      return () => {
        parent.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [
    selectedCell,
    setSelectedCell,
    clearSelectedCell,
    rowCount,
    colCount,
    activeSheet,
  ]);

  const handleColumnResizeStart = (colIndex: number, startX: number) => {
    if (!activeSheet) return;
    setResizing({
      type: "col",
      index: colIndex,
      startPos: startX,
      startSize: activeSheet.columnWidths?.[colIndex] ?? 100,
    });
  };

  const handleRowResizeStart = (rowIndex: number, startY: number) => {
    if (!activeSheet) return;
    setResizing({
      type: "row",
      index: rowIndex,
      startPos: startY,
      startSize: activeSheet.rowHeights?.[rowIndex] ?? 35,
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
    <div
      ref={parentRef}
      className="flex-1 overflow-auto relative"
      style={{
        height: "100%",
        width: "100%",
      }}
      tabIndex={0}
    >
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
          <ContextMenu key={virtualColumn.index}>
            <ContextMenuTrigger asChild>
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
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                onClick={() =>
                  activeSheet && addColumn(activeSheet.id, virtualColumn.index)
                }
              >
                Insert column left
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() =>
                  activeSheet &&
                  addColumn(activeSheet.id, virtualColumn.index + 1)
                }
              >
                Insert column right
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() =>
                  activeSheet &&
                  removeColumn(activeSheet.id, virtualColumn.index)
                }
              >
                Delete column
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}

        {/* Row Headers */}
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <ContextMenu key={virtualRow.index}>
            <ContextMenuTrigger asChild>
              <div
                key={virtualRow.index}
                className="absolute left-0 top-0 bg-gray-200 border-r border-b border-gray-300 flex items-center justify-center font-bold group"
                style={{
                  transform: `translateY(${virtualRow.start + 32}px)`,
                  width: 48,
                  height: `${virtualRow.size}px`,
                }}
              >
                {virtualRow.index + 1}
                <div
                  onMouseDown={(e) =>
                    handleRowResizeStart(virtualRow.index, e.clientY)
                  }
                  className="absolute bottom-0 left-0 w-full h-1 cursor-row-resize bg-blue-500 opacity-0 group-hover:opacity-100"
                />
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                onClick={() =>
                  activeSheet && addRow(activeSheet.id, virtualRow.index)
                }
              >
                Insert row above
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() =>
                  activeSheet && addRow(activeSheet.id, virtualRow.index + 1)
                }
              >
                Insert row below
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() =>
                  activeSheet && removeRow(activeSheet.id, virtualRow.index)
                }
              >
                Delete row
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
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
