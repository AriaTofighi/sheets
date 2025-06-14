import "./App.css";
import { Toaster } from "@/components/ui/sonner";
import Toolbar from "./components/spreadsheet/Toolbar";
import Sheet from "./components/spreadsheet/Sheet";
import { SheetTabs } from "./components/sheet-tabs";
import { useStore } from "./lib/store";
import { useEffect } from "react";

function App() {
  const { undo, redo } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo]);

  return (
    <div className="h-screen w-screen flex flex-col">
      <Toolbar />
      <Sheet />
      <SheetTabs />
      <Toaster />
    </div>
  );
}

export default App;
