import React from "react";
import {
  Bell,
  Plus,
  Download,
  TrendingUp,
  ArrowUpRight,
  X,
} from "lucide-react";

export const PortfolioHeader: React.FC<{
  onClose?: () => void;
  activeTab?: "portfolio" | "analytics" | "markets" | "settings";
  setActiveTab?: (
    tab: "portfolio" | "analytics" | "markets" | "settings",
  ) => void;
  hasDock?: boolean;
}> = ({ onClose, activeTab = "portfolio", setActiveTab, hasDock = false }) => {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 md:px-8 py-1.5 sm:py-2 bg-white dark:bg-pplx-primary border-b border-gray-100 dark:border-zinc-800 sticky top-0 z-30 transition-colors duration-300">
      <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
        <div className="flex items-center gap-2 sm:gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 -ml-1.5 sm:-ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-50 dark:hover:bg-pplx-hover rounded-lg sm:rounded-xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-zinc-800 active:scale-90"
              title="Close Dashboard"
            >
              <X size={16} className="sm:w-5 sm:h-5" />
            </button>
          )}
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-zinc-900 dark:bg-zinc-100 rounded-lg sm:rounded-xl flex items-center justify-center text-white dark:text-zinc-900 text-sm sm:text-base font-black shadow-lg shadow-zinc-500/20 dark:shadow-none font-display">
            R
          </div>
          <span className="text-base sm:text-lg font-black text-gray-900 dark:text-zinc-100 hidden xs:inline-block tracking-tighter font-display">
            Robo Portfolio
          </span>
        </div>
        <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 hidden md:block" />
        <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-[0.15em] hidden lg:block">
          Consolidated Dashboard
        </span>
      </div>

      <nav className="hidden md:flex items-center gap-6 lg:gap-10">
        {[
          { id: "portfolio", label: "Portfolio" },
          { id: "analytics", label: "Analytics" },
          { id: "markets", label: "Markets" },
          { id: "settings", label: "Settings" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab?.(tab.id as any)}
            className={`text-sm sm:text-base font-black transition-all relative py-1.5 font-display ${activeTab === tab.id ? "text-zinc-900 dark:text-zinc-100 after:absolute after:bottom-[-13px] sm:after:bottom-[-15px] after:left-0 after:right-0 after:h-0.5 sm:after:h-1 after:bg-zinc-900 dark:after:bg-zinc-100 after:rounded-full" : "text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Mobile Navigation */}
      <div
        className="flex md:hidden fixed left-0 right-0 bg-white dark:bg-pplx-primary border-t border-gray-100 dark:border-zinc-800 px-4 py-2.5 justify-around items-center z-50"
        style={{
          bottom: hasDock ? "calc(72px + env(safe-area-inset-bottom))" : "0px",
        }}
      >
        {[
          { id: "portfolio", label: "Port" },
          { id: "analytics", label: "Analyt" },
          { id: "markets", label: "Mark" },
          { id: "settings", label: "Set" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab?.(tab.id as any)}
            className={`text-xs font-black transition-all px-3 py-1.5 rounded-xl ${activeTab === tab.id ? "bg-zinc-100 dark:bg-pplx-card text-zinc-900 dark:text-zinc-100" : "text-gray-400 dark:text-zinc-500"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
        <button className="p-2 sm:p-3 text-gray-400 dark:text-zinc-500 hover:bg-gray-50 dark:hover:bg-pplx-hover rounded-xl sm:rounded-2xl transition-colors border border-transparent hover:border-gray-200 dark:hover:border-zinc-800 active:scale-95">
          <Bell size={18} className="sm:w-5 sm:h-5" />
        </button>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-zinc-800 shadow-md">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            alt="User"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
};

export const StatsOverview: React.FC<{
  totalValue: number;
  ytd: number;
  lastMonth: number;
  volatility: number;
  onNewEntry: () => void;
  onExport?: () => void;
}> = ({ totalValue, ytd, lastMonth, volatility, onNewEntry, onExport }) => {
  return (
    <div className="py-4 sm:py-6 md:py-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 md:gap-10">
        <div className="space-y-1 sm:space-y-2">
          <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
            Net Worth
          </span>
          <div className="flex items-baseline gap-2 sm:gap-3 md:gap-4">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 dark:text-gray-100 tracking-tighter font-display">
              €
              {totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </h1>
            <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg md:rounded-xl text-[10px] sm:text-xs md:sm font-black">
              <ArrowUpRight size={14} className="sm:w-4 sm:h-4" />
              <span>+2.4%</span>
            </div>
          </div>
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 dark:text-gray-500 font-medium">
            Consolidated balance across 12 platforms
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8 md:gap-16">
          <div className="space-y-0.5 sm:space-y-1 md:space-y-2">
            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              YTD Returns
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-600 dark:text-emerald-400 font-black text-base sm:text-lg md:text-xl font-display">
              <TrendingUp size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
              <span>+{ytd}%</span>
            </div>
          </div>
          <div className="space-y-0.5 sm:space-y-1 md:space-y-2">
            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Last Month
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-600 dark:text-emerald-400 font-black text-base sm:text-lg md:text-xl font-display">
              <TrendingUp size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
              <span>+{lastMonth}%</span>
            </div>
          </div>
          <div className="space-y-0.5 sm:space-y-1 md:space-y-2 hidden sm:block">
            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Volatility
            </span>
            <div className="text-gray-900 dark:text-gray-100 font-black text-base sm:text-lg md:text-xl font-display">
              {volatility}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <button
            onClick={onExport}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm font-black text-gray-600 dark:text-zinc-300 bg-white dark:bg-pplx-card border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-pplx-hover rounded-lg sm:rounded-xl md:rounded-2xl transition-all shadow-sm active:scale-95"
          >
            <Download size={14} className="sm:w-4 sm:h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={onNewEntry}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-xs md:text-sm font-black text-white dark:text-zinc-900 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white rounded-lg sm:rounded-xl md:rounded-2xl transition-all shadow-xl shadow-zinc-500/20 active:scale-95"
          >
            <Plus size={14} className="sm:w-4 sm:h-4" />
            <span>New Asset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
