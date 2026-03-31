
import React, { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, RadarChart, PolarGrid, 
  PolarAngleAxis, Radar, BarChart, Bar 
} from 'recharts';
import { 
  Bell, Search, TrendingUp, Shield, Apple, Cloud, 
  Coins, Building2, Zap, Cpu, LayoutGrid, 
  ArrowUpRight, ArrowDownRight, Edit3, Trash2, 
  Plus, Filter, Download, ChevronRight, Activity,
  Target, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PortfolioData, PortfolioAsset } from '../types';

const COLORS = ['#1e293b', '#6366f1', '#3b82f6', '#f59e0b', '#94a3b8', '#ef4444', '#10b981', '#8b5cf6'];

const ASSET_LOGOS: Record<string, React.ReactNode> = {
  'AAPL': <Apple className="w-5 h-5" />,
  'MSFT': <Cloud className="w-5 h-5" />,
  'VUSA': <LayoutGrid className="w-5 h-5" />,
  'GOLD': <Coins className="w-5 h-5" />,
  'BTC': <Coins className="w-5 h-5 text-orange-500" />,
  'O': <Building2 className="w-5 h-5" />,
  'NSRGY': <Zap className="w-5 h-5" />,
  'TSLA': <Zap className="w-5 h-5" />,
  'NVDA': <Cpu className="w-5 h-5" />,
};

export const PortfolioDashboard: React.FC<{ data: PortfolioData }> = () => {
  const [assets, setAssets] = useState<PortfolioAsset[]>([
    { id: '1', name: 'Apple Inc.', ticker: 'AAPL', type: 'stock', value: 142400, change: 0.4, quantity: 850, purchasePrice: 145.20, riskLevel: 'low' },
    { id: '2', name: 'Microsoft Corp', ticker: 'MSFT', type: 'stock', value: 98210, change: 1.2, quantity: 320, purchasePrice: 280.50, riskLevel: 'low' },
    { id: '3', name: 'Vanguard S&P 500', ticker: 'VUSA', type: 'etf', value: 210000, change: 2.1, quantity: 2500, purchasePrice: 78.40, riskLevel: 'low' },
    { id: '4', name: 'iShares Gold', ticker: 'GOLD', type: 'commodity', value: 122800, change: 0.0, quantity: 1500, purchasePrice: 81.20, riskLevel: 'medium' },
    { id: '5', name: 'Bitcoin', ticker: 'BTC', type: 'crypto', value: 45200, change: 5.4, quantity: 1.2, purchasePrice: 32000, riskLevel: 'high' },
    { id: '6', name: 'Realty Income', ticker: 'O', type: 'stock', value: 64500, change: -0.2, quantity: 1200, purchasePrice: 58.90, riskLevel: 'medium' },
    { id: '7', name: 'Tesla, Inc.', ticker: 'TSLA', type: 'stock', value: 29400, change: -1.2, quantity: 150, purchasePrice: 210.30, riskLevel: 'high' },
    { id: '8', name: 'Nvidia Corp', ticker: 'NVDA', type: 'stock', value: 18200, change: 3.2, quantity: 40, purchasePrice: 420.50, riskLevel: 'high' },
  ]);

  const [showNewEntry, setShowNewEntry] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [activities, setActivities] = useState<{ id: string, type: 'add' | 'edit' | 'delete', asset: string, time: string }[]>([
    { id: '1', type: 'edit', asset: 'AAPL', time: '2 mins ago' },
    { id: '2', type: 'add', asset: 'NVDA', time: '1 hour ago' },
  ]);

  // Real-time calculations
  const totalValue = useMemo(() => assets.reduce((sum, asset) => sum + asset.value, 0), [assets]);
  
  const healthScore = useMemo(() => {
    const diversity = Math.min(assets.length * 10, 40);
    const riskBalance = assets.filter(a => a.riskLevel === 'low').length * 5;
    return Math.min(diversity + riskBalance + 30, 100);
  }, [assets]);

  const sectorData = useMemo(() => {
    const sectors: Record<string, number> = {};
    assets.forEach(asset => {
      sectors[asset.type] = (sectors[asset.type] || 0) + asset.value;
    });
    return Object.entries(sectors).map(([name, value]) => ({ name, value }));
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           asset.ticker.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === 'all' || asset.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [assets, searchQuery, filterType]);

  const performanceData = [
    { month: 'JUL', value: 1280000 },
    { month: 'AUG', value: 1310000 },
    { month: 'SEP', value: 1290000 },
    { month: 'OCT', value: 1340000 },
    { month: 'NOV', value: 1390000 },
    { month: 'DEC', value: 1380000 },
    { month: 'JAN', value: 1440000 },
    { month: 'FEB', value: 1470000 },
    { month: 'MAR', value: 1510000 },
    { month: 'APR', value: 1480000 },
    { month: 'MAY', value: 1540000 },
    { month: 'JUN', value: 1590000 },
  ];

  const riskProfileData = [
    { category: 'Growth', value: 85 },
    { category: 'Value', value: 65 },
    { category: 'Income', value: 45 },
    { category: 'Safety', value: 70 },
    { category: 'Volatility', value: 30 },
  ];

  const addActivity = (type: 'add' | 'edit' | 'delete', asset: string) => {
    setActivities(prev => [{
      id: Date.now().toString(),
      type,
      asset,
      time: 'Just now'
    }, ...prev].slice(0, 5));
  };

  const handleUpdateAsset = (id: string, field: keyof PortfolioAsset, value: any) => {
    const asset = assets.find(a => a.id === id);
    if (asset) {
      setAssets(prev => prev.map(a => 
        a.id === id ? { ...a, [field]: value } : a
      ));
      addActivity('edit', asset.ticker);
    }
  };

  const handleDeleteAsset = (id: string) => {
    const asset = assets.find(a => a.id === id);
    if (asset) {
      setAssets(prev => prev.filter(a => a.id !== id));
      addActivity('delete', asset.ticker);
    }
  };

  const handleAddAsset = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ticker = (formData.get('ticker') as string).toUpperCase();
    const newAsset: PortfolioAsset = {
      id: Date.now().toString(),
      name: formData.get('name') as string,
      ticker,
      type: formData.get('type') as any,
      value: Number(formData.get('value')),
      change: 0,
      quantity: Number(formData.get('quantity')),
      purchasePrice: Number(formData.get('purchasePrice')),
      riskLevel: formData.get('riskLevel') as any,
    };
    setAssets(prev => [...prev, newAsset]);
    addActivity('add', ticker);
    setShowNewEntry(false);
  };

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen text-[#1e293b] font-sans selection:bg-blue-100">
      {/* Live Ticker */}
      <div className="bg-slate-900 text-white py-2 px-4 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-8 overflow-hidden whitespace-nowrap border-b border-white/10">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 items-center text-[10px] font-bold uppercase tracking-widest"
        >
          {['BTC +2.4%', 'ETH -1.2%', 'AAPL +0.5%', 'TSLA -3.1%', 'GOLD +0.2%', 'SPY +1.1%', 'NVDA +4.5%', 'MSFT +0.8%'].map((tick, i) => (
            <span key={i} className={tick.includes('+') ? 'text-emerald-400' : 'text-rose-400'}>
              {tick}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {['BTC +2.4%', 'ETH -1.2%', 'AAPL +0.5%', 'TSLA -3.1%', 'GOLD +0.2%', 'SPY +1.1%', 'NVDA +4.5%', 'MSFT +0.8%'].map((tick, i) => (
            <span key={`dup-${i}`} className={tick.includes('+') ? 'text-emerald-400' : 'text-rose-400'}>
              {tick}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Top Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
        <div className="flex items-center gap-5">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-14 h-14 bg-gradient-to-br from-[#20B8CD] to-[#3b82f6] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/20"
          >
            P
          </motion.div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Portfolio Manager</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live Market Sync Active
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none lg:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search assets, tickers, sectors..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100">
                <img src="https://picsum.photos/seed/user/100/100" alt="User" referrerPolicy="no-referrer" />
              </div>
              <div className="hidden sm:block pr-2">
                <div className="text-xs font-black text-slate-900">V. Catalin</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Premium Plan</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Total Net Worth', value: `€${totalValue.toLocaleString()}`, change: '+12.4%', icon: <TrendingUp className="text-blue-500" />, color: 'blue' },
          { label: 'Portfolio Health', value: `${healthScore}/100`, change: 'Optimal', icon: <Activity className="text-emerald-500" />, color: 'emerald' },
          { label: 'Risk Exposure', value: '64/100', change: 'Moderate', icon: <Shield className="text-amber-500" />, color: 'amber' },
          { label: 'Active Strategies', value: '4 Active', change: '2 Pending', icon: <Target className="text-indigo-500" />, color: 'indigo' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3.5 rounded-2xl bg-${stat.color}-50 group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-bold ${stat.color === 'emerald' ? 'text-emerald-500 bg-emerald-50' : 'text-blue-500 bg-blue-50'} px-2.5 py-1 rounded-lg`}>
                <ArrowUpRight size={12} />
                {stat.change}
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Charts & Analysis */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Main Performance Chart */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Performance Analytics</h3>
                <p className="text-xs text-slate-400 font-medium">Consolidated portfolio growth metrics</p>
              </div>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                {['1D', '1W', '1M', '1Y', 'ALL'].map(t => (
                  <button key={t} className={`px-5 py-2.5 text-[10px] font-bold rounded-xl transition-all ${t === '1Y' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    tickFormatter={(v) => `€${(v/1000000).toFixed(1)}M`}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px' }}
                    formatter={(v: any) => [`€${v.toLocaleString()}`, 'Portfolio Value']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Asset List & Real-time Editing */}
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="flex items-center gap-6">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Asset Inventory</h3>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
                  <Filter size={14} className="text-slate-400" />
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer"
                  >
                    <option value="all">All Sectors</option>
                    <option value="stock">Equity</option>
                    <option value="crypto">Digital Assets</option>
                    <option value="etf">Index Funds</option>
                    <option value="commodity">Commodities</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-[10px] font-bold rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest">
                  <Download size={16} /> Export
                </button>
                <button 
                  onClick={() => setShowNewEntry(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-[10px] font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 uppercase tracking-widest"
                >
                  <Plus size={16} /> New Asset
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Price/Qty</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total Value</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Change</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode="popLayout">
                    {filteredAssets.map((asset) => (
                      <motion.tr 
                        key={asset.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                              {ASSET_LOGOS[asset.ticker] || <LayoutGrid size={20} />}
                            </div>
                            <div>
                              <div className="text-sm font-black text-slate-900">{asset.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{asset.ticker} • {asset.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          {editingAssetId === asset.id ? (
                            <div className="flex flex-col items-end gap-2">
                              <input 
                                type="number" 
                                value={asset.purchasePrice} 
                                onChange={(e) => handleUpdateAsset(asset.id, 'purchasePrice', Number(e.target.value))}
                                className="w-28 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                              />
                              <input 
                                type="number" 
                                value={asset.quantity} 
                                onChange={(e) => handleUpdateAsset(asset.id, 'quantity', Number(e.target.value))}
                                className="w-28 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-end">
                              <div className="text-sm font-black text-slate-900">€{asset.purchasePrice?.toLocaleString()}</div>
                              <div className="text-[10px] font-bold text-slate-400">{asset.quantity?.toLocaleString()} units</div>
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="text-sm font-black text-slate-900">€{asset.value.toLocaleString()}</div>
                          <div className="text-[10px] font-bold text-slate-400">{((asset.value / totalValue) * 100).toFixed(1)}% allocation</div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black ${asset.change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {asset.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(asset.change)}%
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setEditingAssetId(editingAssetId === asset.id ? null : asset.id)}
                              className={`p-2.5 rounded-xl transition-all ${editingAssetId === asset.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                            >
                              <Edit3 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteAsset(asset.id)}
                              className="p-2.5 bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Allocation & Risk */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Allocation Donut */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-10">Asset Allocation</h3>
            <div className="h-[280px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={assets.slice(0, 6)} 
                    dataKey="value" 
                    innerRadius="75%" 
                    outerRadius="100%" 
                    paddingAngle={8}
                    stroke="none"
                  >
                    {assets.slice(0, 6).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-5xl font-black text-slate-900">{assets.length}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Holdings</div>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-5">
              {assets.slice(0, 4).map((asset, i) => (
                <div key={asset.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i] }}></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-900">{asset.ticker}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{((asset.value / totalValue) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sector Allocation Bar Chart */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-10">Sector Exposure</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} width={80} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Profile Radar */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Risk Analysis</h3>
              <Info size={16} className="text-slate-300 hover:text-blue-500 transition-colors cursor-help" />
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskProfileData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <Radar name="Portfolio" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 p-6 bg-slate-900 rounded-[2rem] shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="text-blue-400" size={18} />
                <span className="text-xs font-black text-white">Strategic Balance</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Your portfolio is currently optimized for long-term growth with a moderate risk ceiling. Diversification is within optimal parameters.</p>
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">Recent Activity</h3>
            <div className="space-y-6">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activity.type === 'add' ? 'bg-emerald-50 text-emerald-600' : 
                    activity.type === 'edit' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {activity.type === 'add' ? <Plus size={16} /> : 
                     activity.type === 'edit' ? <Edit3 size={16} /> : <Trash2 size={16} />}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-black text-slate-900">
                      {activity.type === 'add' ? 'Added' : activity.type === 'edit' ? 'Modified' : 'Removed'} {activity.asset}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{activity.time}</div>
                  </div>
                  <ChevronRight size={14} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Entry Modal */}
      <AnimatePresence>
        {showNewEntry && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewEntry(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
              
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add New Asset</h2>
                  <p className="text-sm text-slate-400 font-medium">Expand your curated portfolio</p>
                </div>
                <button onClick={() => setShowNewEntry(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors">
                  <Trash2 size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddAsset} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Asset Name</label>
                    <input name="name" required type="text" placeholder="e.g. Ethereum" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ticker Symbol</label>
                    <input name="ticker" required type="text" placeholder="e.g. ETH" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Type</label>
                    <select name="type" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer">
                      <option value="stock">Stock</option>
                      <option value="crypto">Crypto</option>
                      <option value="etf">ETF</option>
                      <option value="commodity">Commodity</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                    <input name="quantity" required type="number" step="any" placeholder="0.00" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Avg. Price</label>
                    <input name="purchasePrice" required type="number" step="any" placeholder="€0.00" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Value</label>
                    <input name="value" required type="number" step="any" placeholder="€0.00" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Risk Level</label>
                    <div className="flex gap-2">
                      {['low', 'medium', 'high'].map(level => (
                        <label key={level} className="flex-1">
                          <input type="radio" name="riskLevel" value={level} className="sr-only peer" defaultChecked={level === 'medium'} />
                          <div className="text-center py-4 rounded-2xl border border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-widest cursor-pointer peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 transition-all">
                            {level}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowNewEntry(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 uppercase tracking-widest"
                  >
                    Add to Portfolio
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
