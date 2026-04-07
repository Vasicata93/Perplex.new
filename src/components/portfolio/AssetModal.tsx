import React, { useState, useEffect } from "react";
import { X, Save, Trash2 } from "lucide-react";
import { Asset, Position } from "../../types/portfolio";

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (asset: Asset, position: Position) => void;
  onDelete?: (id: string) => void;
  initialAsset?: Asset;
  initialPosition?: Position;
}

export const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialAsset,
  initialPosition,
}) => {
  const [asset, setAsset] = useState<Asset>(
    initialAsset || {
      id: "",
      name: "",
      symbol: "",
      type: "Equity",
      sector: "",
      emoji: "📈",
      color: "#6366f1",
    },
  );
  const [position, setPosition] = useState<Position>(
    initialPosition || {
      id: "",
      assetId: "",
      shares: 0,
      avgCost: 0,
      costBasis: 0,
      currentPrice: 0,
      lastUpdate: Date.now(),
    },
  );

  useEffect(() => {
    if (initialAsset) setAsset(initialAsset);
    if (initialPosition) setPosition(initialPosition);
  }, [initialAsset, initialPosition]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(asset, position);
  };

  const updatePosition = (newPosition: Partial<Position>) => {
    const updated = { ...position, ...newPosition };
    if (newPosition.shares !== undefined || newPosition.avgCost !== undefined) {
      updated.costBasis = updated.shares * updated.avgCost;
    }
    setPosition(updated);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-colors duration-300">
      <div className="bg-white dark:bg-pplx-card w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-zinc-800 animate-in slide-in-from-bottom sm:slide-in-from-none transition-colors duration-300">
        <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-gray-50 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="text-lg font-black text-gray-900 dark:text-zinc-100">
            {initialAsset ? "Edit Position" : "New Entry"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 dark:hover:bg-pplx-hover rounded-full transition-colors text-gray-400 dark:text-zinc-500"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 space-y-4 sm:space-y-6 max-h-[80vh] overflow-y-auto"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                Asset Name
              </label>
              <input
                required
                className="w-full bg-gray-50 dark:bg-pplx-secondary border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                placeholder="Apple Inc."
                value={asset.name}
                onChange={(e) => setAsset({ ...asset, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                Symbol
              </label>
              <input
                required
                className="w-full bg-gray-50 dark:bg-pplx-secondary border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                placeholder="AAPL"
                value={asset.symbol}
                onChange={(e) =>
                  setAsset({ ...asset, symbol: e.target.value.toUpperCase() })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                Type
              </label>
              <select
                className="w-full bg-gray-50 dark:bg-pplx-secondary border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors appearance-none"
                value={asset.type}
                onChange={(e) =>
                  setAsset({ ...asset, type: e.target.value as any })
                }
              >
                <option value="Equity">Equity</option>
                <option value="Crypto">Crypto</option>
                <option value="ETF">ETF</option>
                <option value="Hedge">Hedge</option>
                <option value="REIT">REIT</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                Sector
              </label>
              <input
                className="w-full bg-gray-50 dark:bg-pplx-secondary border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                placeholder="Tech"
                value={asset.sector}
                onChange={(e) => setAsset({ ...asset, sector: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                Shares
              </label>
              <input
                type="number"
                step="any"
                required
                className="w-full bg-gray-50 dark:bg-pplx-secondary border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                value={position.shares}
                onChange={(e) =>
                  updatePosition({ shares: parseFloat(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                Avg Cost
              </label>
              <input
                type="number"
                step="any"
                required
                className="w-full bg-gray-50 dark:bg-pplx-secondary border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                value={position.avgCost}
                onChange={(e) =>
                  updatePosition({ avgCost: parseFloat(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                Current Price
              </label>
              <input
                type="number"
                step="any"
                required
                className="w-full bg-gray-50 dark:bg-pplx-secondary border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-zinc-100 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                value={position.currentPrice}
                onChange={(e) =>
                  updatePosition({ currentPrice: parseFloat(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
            {initialAsset && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(initialPosition!.id)}
                className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors flex items-center justify-center gap-2 border border-rose-100 dark:border-rose-500/20 sm:border-transparent"
              >
                <Trash2 size={20} />
                <span className="sm:hidden font-bold">Delete Position</span>
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 font-bold py-3 rounded-xl shadow-lg shadow-zinc-100 dark:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} />
              <span>{initialAsset ? "Save Changes" : "Create Entry"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
