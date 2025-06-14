import { Button } from "@/components/ui/button";
import FormulaBar from "./FormulaBar";

const Toolbar = () => {
  return (
    <div className="flex flex-col">
      <div className="h-10 border-b border-gray-200 p-2 flex items-center space-x-2">
        <Button variant="outline" size="sm">
          New Sheet
        </Button>
        <Button variant="outline" size="sm">
          Export
        </Button>
      </div>
      <FormulaBar />
    </div>
  );
};

export default Toolbar;
