import { useStore } from "@/lib/store";

export const SheetTabs = () => {
  const { sheets, activeSheetId, addSheet, setActiveSheetId } = useStore();

  return (
    <div className="flex items-center border-t border-gray-300 bg-gray-100">
      <div className="flex">
        {sheets.map((sheet) => (
          <button
            key={sheet.id}
            onClick={() => setActiveSheetId(sheet.id)}
            className={`px-4 py-2 text-sm ${
              activeSheetId === sheet.id
                ? "bg-white border-b-2 border-blue-500"
                : "hover:bg-gray-200"
            }`}
          >
            {sheet.name}
          </button>
        ))}
      </div>
      <button
        onClick={addSheet}
        className="px-4 py-2 text-sm hover:bg-gray-200"
      >
        +
      </button>
    </div>
  );
};
