import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useRef } from "react";
import FormulaBar from "./FormulaBar";

const Toolbar = () => {
  const {
    activeSheetId,
    exportToCSV,
    importFromCSV,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (activeSheetId) {
      exportToCSV(activeSheetId);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeSheetId) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvData = e.target?.result as string;
      if (csvData) {
        importFromCSV(activeSheetId, csvData);
      }
    };
    reader.readAsText(file);

    // Reset the input so the same file can be selected again
    event.target.value = "";
  };

  return (
    <div className="flex flex-col">
      <div className="h-10 border-b border-gray-200 p-2 flex items-center space-x-2">
        <Button variant="outline" size="sm">
          New Sheet
        </Button>
        <div className="border-l border-gray-300 h-6 mx-2" />
        <Button
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={!canUndo()}
        >
          Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={!canRedo()}
        >
          Redo
        </Button>
        <div className="border-l border-gray-300 h-6 mx-2" />
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={!activeSheetId}
        >
          Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleImportClick}
          disabled={!activeSheetId}
        >
          Import CSV
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              localStorage.removeItem("spreadsheet-storage");
              window.location.reload();
            }}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Data
          </button>
        </div>
      </div>
      <FormulaBar />
    </div>
  );
};

export default Toolbar;
