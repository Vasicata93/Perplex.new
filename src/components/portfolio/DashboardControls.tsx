import React from "react";
import { Search, LayoutGrid, List as ListIcon } from "lucide-react";

interface DashboardControlsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
}

export const DashboardControls: React.FC<DashboardControlsProps> = ({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  viewMode,
  setViewMode,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2 px-4 sm:px-5 bg-white dark:bg-pplx-card rounded-xl sm:rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-2 w-full sm:w-auto bg-gray-50 dark:bg-pplx-secondary px-3 py-1.5 rounded-lg sm:rounded-xl border border-gray-100 dark:border-zinc-800">
        <Search size={16} className="text-gray-400" />
        <input
          type="text"
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-xs sm:text-sm text-gray-900 dark:text-zinc-100 w-full sm:w-40 placeholder:text-gray-400 font-medium"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
        <div className="flex items-center gap-1 w-full sm:w-auto bg-gray-50 dark:bg-pplx-secondary p-1 rounded-lg sm:rounded-xl border border-gray-100 dark:border-zinc-800">
          {["All", "Stock", "Crypto", "Cash"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 px-2 py-1 text-[8px] sm:text-[9px] font-bold rounded-md sm:rounded-lg transition-all whitespace-nowrap active:scale-95 ${
                filterType === type
                  ? "bg-white dark:bg-pplx-card text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-gray-200 dark:bg-zinc-800 mx-0.5 hidden sm:block" />

        <div className="flex items-center gap-1 bg-gray-50 dark:bg-pplx-secondary p-1 rounded-lg sm:rounded-xl border border-gray-100 dark:border-zinc-800 w-auto justify-center">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg transition-all active:scale-90 ${
              viewMode === "grid"
                ? "bg-white dark:bg-pplx-card text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100"
            }`}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg transition-all active:scale-90 ${
              viewMode === "list"
                ? "bg-white dark:bg-pplx-card text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100"
            }`}
          >
            <ListIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
