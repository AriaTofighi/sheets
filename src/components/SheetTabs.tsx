import { useStore } from "@/lib/store";
import { XIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export const SheetTabs = () => {
  const {
    sheets,
    activeSheetId,
    addSheet,
    setActiveSheetId,
    renameSheet,
    deleteSheet,
  } = useStore();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renamingId]);

  const handleDoubleClick = (sheetId: string, currentName: string) => {
    setRenamingId(sheetId);
    setTempName(currentName);
  };

  const handleRename = () => {
    if (renamingId && tempName.trim()) {
      renameSheet(renamingId, tempName.trim());
    }
    setRenamingId(null);
    setTempName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setRenamingId(null);
      setTempName("");
    }
  };

  return (
    <div className="flex items-center border-t bg-muted">
      <div className="flex">
        {sheets.map((sheet) => (
          <div
            key={sheet.id}
            onDoubleClick={() => handleDoubleClick(sheet.id, sheet.name)}
            className={`flex items-center group px-4 py-2 text-sm relative border-r ${
              activeSheetId === sheet.id
                ? "bg-background border-b-2 border-primary"
                : "hover:bg-accent"
            }`}
          >
            {renamingId === sheet.id ? (
              <input
                ref={inputRef}
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                className="bg-transparent outline-none ring-1 ring-ring"
              />
            ) : (
              <button onClick={() => setActiveSheetId(sheet.id)}>
                {sheet.name}
              </button>
            )}
            {sheets.length > 1 && (
              <button
                onClick={() => deleteSheet(sheet.id)}
                className="ml-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
              >
                <XIcon size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button onClick={addSheet} className="px-4 py-2 text-sm hover:bg-accent">
        +
      </button>
    </div>
  );
};
