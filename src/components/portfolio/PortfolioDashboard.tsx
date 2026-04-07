import React, { useState, useEffect, useMemo } from "react";
import { PortfolioHeader, StatsOverview } from "./DashboardHeader";
import { DashboardControls } from "./DashboardControls";
import { AllocationChart } from "./AllocationChart";
import { PerformanceChart } from "./PerformanceChart";
import { AssetList, StrategyList } from "./AssetList";
import { AssetModal } from "./AssetModal";
import { portfolioService } from "../../services/portfolioService";
import {
  Asset,
  Position,
  Strategy,
  PerformancePoint,
} from "../../types/portfolio";
import { v4 as uuidv4 } from "uuid";
import { RefreshCcw, Download } from "lucide-react";

declare global {
  interface Window {
    portfolioActions?: {
      getAssets: () => Asset[];
      getPositions: () => Position[];
      addAssetAndPosition: (
        asset: Partial<Asset>,
        position: Partial<Position>,
      ) => Promise<void>;
      updateAssetAndPosition: (
        positionId: string,
        asset: Partial<Asset>,
        position: Partial<Position>,
      ) => Promise<void>;
      deletePosition: (positionId: string) => Promise<void>;
    };
  }
}

interface PortfolioDashboardProps {
  onClose?: () => void;
  hasDock?: boolean;
}

export const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({
  onClose,
  hasDock = false,
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [performance, setPerformance] = useState<PerformancePoint[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [sortBy] = useState<"value" | "name" | "performance">("value");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [activeTab, setActiveTab] = useState<
    "portfolio" | "analytics" | "markets" | "settings"
  >("portfolio");

  // AI Action Bridge
  useEffect(() => {
    window.portfolioActions = {
      getAssets: () => assets,
      getPositions: () => positions,
      addAssetAndPosition: async (assetData, positionData) => {
        const assetId = uuidv4();
        const posId = uuidv4();
        const newAsset = { ...assetData, id: assetId } as Asset;
        const newPos = {
          ...positionData,
          id: posId,
          assetId,
          lastUpdate: Date.now(),
        } as Position;

        const newAssets = [...assets, newAsset];
        const newPositions = [...positions, newPos];

        setAssets(newAssets);
        setPositions(newPositions);
        await portfolioService.saveAssets(newAssets);
        await portfolioService.savePositions(newPositions);
      },
      updateAssetAndPosition: async (positionId, assetData, positionData) => {
        const existingPos = positions.find((p) => p.id === positionId);
        if (!existingPos) return;

        const newPositions = positions.map((p) =>
          p.id === positionId
            ? ({
                ...p,
                ...positionData,
                id: p.id,
                assetId: p.assetId,
                lastUpdate: Date.now(),
              } as Position)
            : p,
        );
        const newAssets = assets.map((a) =>
          a.id === existingPos.assetId
            ? ({ ...a, ...assetData, id: a.id } as Asset)
            : a,
        );

        setAssets(newAssets);
        setPositions(newPositions);
        await portfolioService.saveAssets(newAssets);
        await portfolioService.savePositions(newPositions);
      },
      deletePosition: async (positionId) => {
        const newPositions = positions.filter((p) => p.id !== positionId);
        setPositions(newPositions);
        await portfolioService.savePositions(newPositions);
      },
    };
    return () => {
      delete window.portfolioActions;
    };
  }, [assets, positions]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await portfolioService.initializeDefaultData();
      const [a, p, s, perf] = await Promise.all([
        portfolioService.getAssets(),
        portfolioService.getPositions(),
        portfolioService.getStrategies(),
        portfolioService.getPerformance(),
      ]);
      console.log("PortfolioDashboard: Loaded data:", {
        assets: a,
        positions: p,
      });
      setAssets(a);
      setPositions(p);
      setStrategies(s);
      setPerformance(perf);
    } catch (error) {
      console.error("PortfolioDashboard: Failed to load portfolio data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("portfolio-updated", loadData);
    return () => window.removeEventListener("portfolio-updated", loadData);
  }, []);

  const filteredAndSortedPositions = useMemo(() => {
    let result = positions.map((pos) => {
      const asset = assets.find((a) => a.id === pos.assetId);
      return { ...pos, asset };
    });

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.asset?.name.toLowerCase().includes(q) ||
          p.asset?.symbol.toLowerCase().includes(q),
      );
    }

    // Filter
    if (filterType !== "All") {
      result = result.filter((p) => p.asset?.type === filterType);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "value") {
        return b.shares * b.currentPrice - a.shares * a.currentPrice;
      }
      if (sortBy === "name") {
        return (a.asset?.name || "").localeCompare(b.asset?.name || "");
      }
      if (sortBy === "performance") {
        const perfA = (a.currentPrice - a.costBasis) / a.costBasis;
        const perfB = (b.currentPrice - b.costBasis) / b.costBasis;
        return perfB - perfA;
      }
      return 0;
    });

    return result;
  }, [positions, assets, searchQuery, filterType, sortBy]);

  const totalValue = positions.reduce(
    (sum, pos) => sum + pos.shares * pos.currentPrice,
    0,
  );

  // Mock metrics for now
  const ytd = 12.4;
  const lastMonth = 4.2;
  const volatility = 8.4;

  const handleSave = async (asset: Asset, position: Position) => {
    let newAssets = [...assets];
    let newPositions = [...positions];

    if (editingPositionId) {
      // Update
      const existingPos = positions.find((p) => p.id === editingPositionId);
      if (existingPos) {
        newPositions = newPositions.map((p) =>
          p.id === editingPositionId
            ? {
                ...position,
                id: p.id,
                assetId: p.assetId,
                lastUpdate: Date.now(),
              }
            : p,
        );
        newAssets = newAssets.map((a) =>
          a.id === existingPos.assetId ? { ...asset, id: a.id } : a,
        );
      }
    } else {
      // Create
      const assetId = uuidv4();
      const posId = uuidv4();
      const newAsset = { ...asset, id: assetId };
      const newPos = {
        ...position,
        id: posId,
        assetId,
        lastUpdate: Date.now(),
      };
      newAssets.push(newAsset);
      newPositions.push(newPos);
    }

    setAssets(newAssets);
    setPositions(newPositions);
    console.log(
      "PortfolioDashboard: handleSave - newAssets:",
      newAssets,
      "newPositions:",
      newPositions,
    );
    try {
      await portfolioService.saveAssets(newAssets);
      await portfolioService.savePositions(newPositions);
      console.log("Portfolio data saved successfully to IndexedDB");
    } catch (error) {
      console.error("Failed to save portfolio data", error);
    }
    setIsModalOpen(false);
    setEditingPositionId(null);
  };

  const handleReset = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset all portfolio data? This action cannot be undone.",
      )
    ) {
      try {
        await portfolioService.resetData();
        await loadData();
        console.log("Portfolio data reset successfully");
      } catch (error) {
        console.error("Failed to reset portfolio data", error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const newPositions = positions.filter((p) => p.id !== id);
    setPositions(newPositions);
    await portfolioService.savePositions(newPositions);
    setIsModalOpen(false);
    setEditingPositionId(null);
  };

  const handleExport = () => {
    const headers = [
      "Asset",
      "Symbol",
      "Type",
      "Shares",
      "Cost Basis",
      "Current Price",
      "Total Value",
      "Profit/Loss",
      "Profit %",
    ];
    const rows = positions.map((pos) => {
      const asset = assets.find((a) => a.id === pos.assetId);
      const value = pos.shares * pos.currentPrice;
      const profit = (pos.currentPrice - pos.costBasis) * pos.shares;
      const profitPercent =
        ((pos.currentPrice - pos.costBasis) / pos.costBasis) * 100;
      return [
        asset?.name || "",
        asset?.symbol || "",
        asset?.type || "",
        pos.shares,
        pos.costBasis,
        pos.currentPrice,
        value,
        profit,
        profitPercent.toFixed(2),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `portfolio_export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "analytics":
        return (
          <div className="space-y-10 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <PerformanceChart data={performance} />
              <AllocationChart assets={assets} positions={positions} />
            </div>
            <div className="bg-white dark:bg-pplx-card p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 dark:text-zinc-100 mb-6 tracking-tight">
                Risk Analysis
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 bg-gray-50 dark:bg-pplx-secondary rounded-2xl border border-gray-100 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] block mb-2">
                    Sharpe Ratio
                  </span>
                  <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">
                    1.84
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 font-medium">
                    Excellent risk-adjusted return
                  </p>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-pplx-secondary rounded-2xl border border-gray-100 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] block mb-2">
                    Max Drawdown
                  </span>
                  <div className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tighter">
                    -12.4%
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 font-medium">
                    Last 12 months peak-to-trough
                  </p>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-pplx-secondary rounded-2xl border border-gray-100 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] block mb-2">
                    Beta
                  </span>
                  <div className="text-3xl font-black text-gray-900 dark:text-zinc-100 tracking-tighter">
                    0.85
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 font-medium">
                    Lower volatility than S&P 500
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case "markets":
        return (
          <div className="space-y-10 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: "S&P 500",
                  price: "5,137.08",
                  change: "+1.2%",
                  color: "emerald",
                },
                {
                  name: "Bitcoin",
                  price: "$64,231.40",
                  change: "+4.5%",
                  color: "emerald",
                },
                {
                  name: "Gold",
                  price: "$2,114.30",
                  change: "-0.3%",
                  color: "rose",
                },
              ].map((m, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-pplx-card p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-2">
                      {m.name}
                    </div>
                    <div className="text-xl font-black text-gray-900 dark:text-zinc-100 tracking-tight">
                      {m.price}
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-lg text-xs font-black ${m.change.startsWith("+") ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"}`}
                  >
                    {m.change}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-pplx-card p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 dark:text-zinc-100 mb-6 tracking-tight">
                Market News
              </h3>
              <div className="space-y-6">
                {[
                  {
                    title: "Fed Signals Potential Rate Cuts Later This Year",
                    time: "2h ago",
                    source: "Financial Times",
                  },
                  {
                    title: "Tech Giants Rally as AI Demand Surges",
                    time: "4h ago",
                    source: "Bloomberg",
                  },
                  {
                    title: "Crypto Markets Hit New Yearly Highs",
                    time: "6h ago",
                    source: "CoinDesk",
                  },
                ].map((n, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-6 group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-gray-50 dark:bg-pplx-secondary rounded-xl flex items-center justify-center text-gray-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors border border-transparent group-hover:border-gray-200 dark:group-hover:border-pplx-hover">
                      <RefreshCcw size={20} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-gray-900 dark:text-zinc-100 group-hover:text-zinc-900 dark:group-hover:text-zinc-400 transition-colors tracking-tight">
                        {n.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {n.source}
                        </span>
                        <span className="text-[10px] text-gray-300 dark:text-zinc-800">
                          •
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {n.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn py-8">
            <div className="bg-white dark:bg-pplx-card p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 dark:text-zinc-100 mb-6 tracking-tight">
                General Settings
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-black text-gray-900 dark:text-zinc-100 tracking-tight">
                      Base Currency
                    </div>
                    <div className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
                      Choose your primary currency for reporting
                    </div>
                  </div>
                  <select className="bg-gray-50 dark:bg-pplx-secondary border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm font-black outline-none focus:ring-2 focus:ring-zinc-500 transition-all">
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="h-px bg-gray-100 dark:bg-zinc-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-black text-gray-900 dark:text-zinc-100 tracking-tight">
                      Dark Mode
                    </div>
                    <div className="text-xs text-gray-500 dark:text-zinc-400 font-medium">
                      Toggle between light and dark themes
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-zinc-900 dark:bg-zinc-100 rounded-full relative cursor-pointer shadow-inner">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white dark:bg-pplx-primary rounded-full shadow-lg transition-all" />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-pplx-card p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 dark:text-zinc-100 mb-6 tracking-tight">
                Data Management
              </h3>
              <div className="space-y-4">
                <button className="w-full py-4 px-6 bg-gray-50 dark:bg-pplx-secondary hover:bg-gray-100 dark:hover:bg-pplx-hover rounded-xl text-sm font-black text-gray-900 dark:text-zinc-100 transition-all text-left flex items-center justify-between border border-transparent hover:border-gray-200 dark:hover:border-zinc-800">
                  <span>Backup Data</span>
                  <Download size={20} className="text-gray-400" />
                </button>
                <button
                  onClick={handleReset}
                  className="w-full py-4 px-6 bg-rose-50 dark:bg-rose-900/10 hover:bg-rose-100 dark:hover:bg-rose-900/20 rounded-xl text-sm font-black text-rose-600 dark:text-rose-400 transition-all text-left flex items-center justify-between border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                >
                  <span>Reset All Data</span>
                  <RefreshCcw size={20} />
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <>
            <StatsOverview
              totalValue={totalValue}
              ytd={ytd}
              lastMonth={lastMonth}
              volatility={volatility}
              onNewEntry={() => {
                setEditingPositionId(null);
                setIsModalOpen(true);
              }}
              onExport={handleExport}
            />

            <DashboardControls
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterType={filterType}
              setFilterType={setFilterType}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10 mt-6 md:mt-10">
              {/* Main Content (Left 2/3) */}
              <div className="lg:col-span-2 space-y-6 md:space-y-10">
                <AllocationChart assets={assets} positions={positions} />
                <PerformanceChart data={performance} />
              </div>

              {/* Sidebar (Right 1/3) */}
              <div className="space-y-6 md:space-y-10">
                <StrategyList strategies={strategies} />
                <AssetList
                  assets={assets}
                  positions={filteredAndSortedPositions as any}
                  onEdit={(id) => {
                    setEditingPositionId(id);
                    setIsModalOpen(true);
                  }}
                  viewMode={viewMode}
                />
              </div>
            </div>
          </>
        );
    }
  };

  const editingPosition = editingPositionId
    ? positions.find((p) => p.id === editingPositionId)
    : undefined;
  const editingAsset = editingPosition
    ? assets.find((a) => a.id === editingPosition.assetId)
    : undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-pplx-primary flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="w-8 h-8 text-zinc-900 dark:text-zinc-100 animate-spin" />
          <p className="text-gray-500 dark:text-zinc-400 font-medium">
            Loading Portfolio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full bg-white dark:bg-pplx-primary text-gray-900 dark:text-zinc-100 font-sans selection:bg-zinc-500/20 selection:text-zinc-900 dark:selection:text-zinc-100 ${hasDock ? "pb-[80px] md:pb-0" : ""} transition-colors duration-300`}
    >
      {/* Semantic Data Layer for AI Agent */}
      <script
        id="portfolio-semantic-data"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            assets,
            positions,
            strategies,
            performance,
          }),
        }}
      />
      <PortfolioHeader
        onClose={onClose}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasDock={hasDock}
      />

      <main className={`w-full p-4 md:p-12 ${hasDock ? "pb-40" : "pb-32"}`}>
        <div className="max-w-[1600px] mx-auto">{renderContent()}</div>
      </main>

      <AssetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPositionId(null);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        initialAsset={editingAsset}
        initialPosition={editingPosition}
      />
    </div>
  );
};
