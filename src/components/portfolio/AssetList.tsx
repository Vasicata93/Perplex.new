import React from "react";
import { Asset, Position, Strategy } from "../../types/portfolio";
import { TrendingUp, TrendingDown, ChevronRight, Plus } from "lucide-react";

interface AssetListProps {
  assets: Asset[];
  positions: Position[];
  onEdit: (id: string) => void;
  viewMode?: "grid" | "list";
}

export const AssetList: React.FC<AssetListProps> = ({
  assets,
  positions,
  onEdit,
  viewMode = "list",
}) => {
  if (positions.length === 0) {
    return (
      <div className="bg-white dark:bg-pplx-card p-12 rounded-3xl border border-gray-200 dark:border-zinc-800 border-dashed flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-50 dark:bg-pplx-secondary rounded-full flex items-center justify-center mb-4">
          <Plus className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-1">
          No Assets Yet
        </h3>
        <p className="text-gray-500 dark:text-zinc-400 text-sm max-w-[200px]">
          Start building your portfolio by adding your first position.
        </p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="bg-white dark:bg-pplx-card p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-zinc-100 uppercase tracking-tight font-display">
            Your Assets
          </h3>
          <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-pplx-secondary px-2.5 py-1 rounded-lg">
            {positions.length} Positions
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {positions.map((pos) => {
            const asset = assets.find((a) => a.id === pos.assetId);
            if (!asset) return null;
            const value = pos.shares * pos.currentPrice;
            const profit = (pos.currentPrice - pos.costBasis) * pos.shares;
            const profitPercent =
              ((pos.currentPrice - pos.costBasis) / pos.costBasis) * 100;

            return (
              <div
                key={pos.id}
                onClick={() => onEdit(pos.id)}
                className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-pplx-accent/30 hover:shadow-md transition-all cursor-pointer group bg-gray-50/30 dark:bg-pplx-secondary/30 active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-pplx-card border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-lg sm:text-xl shadow-sm group-hover:scale-110 transition-transform"
                      style={{ color: asset.color }}
                    >
                      {asset.type === "Crypto" ? "₿" : "📈"}
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-black text-gray-900 dark:text-zinc-100 tracking-tight font-display">
                        {asset.symbol}
                      </div>
                      <div className="text-[9px] text-gray-500 dark:text-zinc-400 uppercase font-bold tracking-widest">
                        {asset.name}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                      Value
                    </div>
                    <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-zinc-100 tracking-tight font-display">
                      $
                      {value.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                      Return
                    </div>
                    <div
                      className={`text-[11px] font-black flex items-center gap-1 ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                    >
                      {profit >= 0 ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )}
                      {profitPercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-pplx-card p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-zinc-100 uppercase tracking-tight font-display">
          Your Assets
        </h3>
        <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-pplx-secondary px-2.5 py-1 rounded-lg">
          {positions.length} Positions
        </span>
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        {positions.map((pos) => {
          const asset = assets.find((a) => a.id === pos.assetId);
          if (!asset) return null;
          const value = pos.shares * pos.currentPrice;
          const profit = (pos.currentPrice - pos.costBasis) * pos.shares;
          const profitPercent =
            ((pos.currentPrice - pos.costBasis) / pos.costBasis) * 100;

          return (
            <div
              key={pos.id}
              onClick={() => onEdit(pos.id)}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-gray-50 dark:hover:bg-pplx-hover transition-all cursor-pointer group border border-transparent hover:border-gray-100 dark:hover:border-zinc-800 active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-50 dark:bg-pplx-secondary flex items-center justify-center text-lg sm:text-xl group-hover:bg-white dark:group-hover:bg-pplx-card group-hover:shadow-md transition-all"
                  style={{ color: asset.color }}
                >
                  {asset.type === "Crypto" ? "₿" : "📈"}
                </div>
                <div>
                  <div className="text-sm sm:text-base font-black text-gray-900 dark:text-zinc-100 tracking-tight font-display">
                    {asset.symbol}
                  </div>
                  <div className="text-[9px] text-gray-500 dark:text-zinc-400 uppercase font-bold tracking-widest">
                    {asset.name}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base sm:text-lg font-black text-gray-900 dark:text-zinc-100 tracking-tight font-display">
                  $
                  {value.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div
                  className={`text-[9px] sm:text-[10px] font-black flex items-center justify-end gap-1 ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                >
                  {profit >= 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {profitPercent.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface StrategyListProps {
  strategies: Strategy[];
}

export const StrategyList: React.FC<StrategyListProps> = ({ strategies }) => {
  return (
    <div className="bg-white dark:bg-pplx-card p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-zinc-100 uppercase tracking-tight font-display">
          Active Strategies
        </h3>
        <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
          {strategies.length} Active
        </span>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            className="p-3.5 sm:p-4 bg-gray-50 dark:bg-pplx-secondary rounded-xl sm:rounded-2xl border border-gray-100 dark:border-zinc-800 hover:border-zinc-100 dark:hover:border-pplx-accent/30 transition-all group cursor-pointer hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-pplx-card flex items-center justify-center text-lg sm:text-xl shadow-sm group-hover:scale-110 transition-transform">
                  {strategy.icon}
                </div>
                <h4 className="text-sm font-black text-gray-900 dark:text-zinc-100 tracking-tight font-display">
                  {strategy.name}
                </h4>
              </div>
              <span
                className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 sm:py-1 rounded-lg ${
                  strategy.status === "Active"
                    ? "bg-zinc-100 dark:bg-pplx-hover text-zinc-900 dark:text-zinc-100"
                    : strategy.status === "Defensive"
                      ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                }`}
              >
                {strategy.status}
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-zinc-400 font-medium leading-relaxed line-clamp-2">
              {strategy.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
