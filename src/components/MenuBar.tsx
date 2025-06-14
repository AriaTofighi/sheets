import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useStore } from "@/lib/store";
import { useRef } from "react";
import { toast } from "sonner";

const MenuBar = () => {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    addSheet,
    activeSheetId,
    importFromCSV,
    exportToCSV,
  } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearData = () => {
    localStorage.removeItem("spreadsheet-storage");
    window.location.reload();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && activeSheetId) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        importFromCSV(activeSheetId, text);
        toast.success("CSV imported successfully!");
      };
      reader.readAsText(file);
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleExport = () => {
    if (activeSheetId) {
      exportToCSV(activeSheetId);
      toast.success("Sheet exported successfully!");
    } else {
      toast.error("No active sheet to export.");
    }
  };

  return (
    <>
      <Menubar className="rounded-none border-b border-l-0 border-r-0 border-t-0 px-2">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onSelect={addSheet}>New Sheet</MenubarItem>
            <MenubarSeparator />
            <MenubarItem onSelect={() => fileInputRef.current?.click()}>
              Import from CSV...
            </MenubarItem>
            <MenubarItem onSelect={handleExport}>Export to CSV...</MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => window.print()}>
              Print <MenubarShortcut>⌘P</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onSelect={handleClearData} variant="destructive">
              Clear Local Data
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onSelect={undo} disabled={!canUndo()}>
              Undo <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onSelect={redo} disabled={!canRedo()}>
              Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleImport}
        style={{ display: "none" }}
      />
    </>
  );
};

export default MenuBar;
