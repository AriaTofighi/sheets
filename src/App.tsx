import "./App.css";
import { Toaster } from "@/components/ui/sonner";
import Toolbar from "./components/spreadsheet/Toolbar";
import Sheet from "./components/spreadsheet/Sheet";
import { SheetTabs } from "./components/sheet-tabs";

function App() {
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
