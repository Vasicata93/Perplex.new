export function buildWidgetHtml(widgetType: string, config: any, theme: 'light' | 'dark' = 'light'): string {
    const isDark = theme === 'dark';
    const textColor = isDark ? '#EBEBEB' : '#666666';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)';

    const resizeScript = `
        <script>
            function sendHeight() {
                const height = document.documentElement.scrollHeight;
                window.parent.postMessage({ type: 'WIDGET_RESIZE', height: height }, '*');
            }
            window.addEventListener('load', sendHeight);
        </script>
    `;

    if (widgetType === 'portfolio-dashboard') {
        const totalValue = config.totalValue || 1420500;
        const ytdReturns = config.ytdReturns || 12.4;
        const healthScore = config.healthScore || 85;
        const assets = config.assets || [];
        const performance = config.performance || [];
        const sectorData = config.sectorData || [
            { name: 'Stock', value: 450000 },
            { name: 'Crypto', value: 120000 },
            { name: 'ETF', value: 650000 },
            { name: 'Commodity', value: 200500 },
        ];

        return `
<!DOCTYPE html>
<html lang="en" class="${isDark ? 'dark' : ''}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio Manager Tracker</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/lucide@0.321.0/dist/umd/lucide.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'system-ui', 'sans-serif'],
                    },
                    colors: {
                        pplx: {
                            primary: '${isDark ? '#191919' : '#FFFFFF'}',
                            secondary: '${isDark ? '#202020' : '#F9F9F9'}',
                            accent: '#20B8CD',
                            border: '${isDark ? '#333333' : '#E5E7EB'}',
                            text: '${isDark ? '#EBEBEB' : '#111111'}',
                            muted: '${isDark ? '#9B9B9B' : '#6B7280'}'
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: transparent;
            font-family: 'Inter', system-ui, sans-serif;
            color: ${isDark ? '#EBEBEB' : '#1a1a1a'};
            transform: scale(0.95);
            transform-origin: top center;
            width: 105.3%;
        }
        .premium-card {
            background: ${isDark ? '#1f1f1f' : '#ffffff'};
            border: 1px solid ${isDark ? '#333' : '#f1f1f1'};
            border-radius: 2rem;
            box-shadow: ${isDark ? '0 10px 30px -10px rgba(0,0,0,0.5)' : '0 4px 20px -5px rgba(0,0,0,0.05)'};
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="bg-transparent p-4 md:p-10">
    <!-- Top Nav -->
    <div class="flex justify-between items-center mb-12 border-b border-pplx-border pb-6">
        <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-[#20B8CD] rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-[#20B8CD]/20">D</div>
            <div class="flex flex-col">
                <div class="text-sm font-bold tracking-tight uppercase">Portfolio Manager</div>
                <div class="text-[9px] text-pplx-muted font-bold uppercase tracking-[0.2em]">Live Market Sync Active</div>
            </div>
        </div>
        <div class="flex items-center gap-4">
            <i data-lucide="bell" class="w-4 h-4 text-pplx-muted"></i>
            <div class="w-8 h-8 rounded-full bg-pplx-secondary border border-pplx-border overflow-hidden">
                <img src="https://picsum.photos/seed/user/100/100" alt="User" class="w-full h-full object-cover">
            </div>
        </div>
    </div>

    <!-- Header Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div class="premium-card p-6">
            <div class="text-[10px] font-bold text-pplx-muted uppercase tracking-widest mb-1">Total Net Worth</div>
            <div class="text-2xl font-black tracking-tight">€${totalValue.toLocaleString()}</div>
        </div>
        <div class="premium-card p-6">
            <div class="text-[10px] font-bold text-pplx-muted uppercase tracking-widest mb-1">YTD Returns</div>
            <div class="text-2xl font-black tracking-tight text-emerald-500">+${ytdReturns}%</div>
        </div>
        <div class="premium-card p-6">
            <div class="text-[10px] font-bold text-pplx-muted uppercase tracking-widest mb-1">Health Score</div>
            <div class="text-2xl font-black tracking-tight text-blue-500">${healthScore}/100</div>
        </div>
        <div class="premium-card p-6">
            <div class="text-[10px] font-bold text-pplx-muted uppercase tracking-widest mb-1">Volatility</div>
            <div class="text-2xl font-black tracking-tight">8.4%</div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <!-- Main Content (Left 2/3) -->
        <div class="lg:col-span-8 flex flex-col gap-10">
            <!-- Performance Chart -->
            <div class="premium-card p-8">
                <div class="flex justify-between items-center mb-8">
                    <h3 class="text-[11px] font-bold text-pplx-muted uppercase tracking-widest">Portfolio Performance</h3>
                    <div class="flex gap-2">
                        <span class="px-3 py-1 bg-pplx-secondary rounded-lg text-[9px] font-bold text-pplx-accent">1Y</span>
                    </div>
                </div>
                <div class="h-64 w-full">
                    <canvas id="performanceChart"></canvas>
                </div>
            </div>

            <!-- Asset Table -->
            <div class="premium-card overflow-hidden">
                <div class="p-8 border-b border-pplx-border">
                    <h3 class="text-[11px] font-bold text-pplx-muted uppercase tracking-widest">Asset Inventory</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-pplx-secondary/50">
                                <th class="px-8 py-4 text-[9px] font-bold text-pplx-muted uppercase tracking-widest">Asset</th>
                                <th class="px-8 py-4 text-[9px] font-bold text-pplx-muted uppercase tracking-widest text-right">Value</th>
                                <th class="px-8 py-4 text-[9px] font-bold text-pplx-muted uppercase tracking-widest text-right">Change</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-pplx-border">
                            ${assets.map((asset: any) => `
                                <tr class="hover:bg-pplx-secondary/30 transition-colors">
                                    <td class="px-8 py-4">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white text-[9px] font-bold">
                                                ${asset.ticker}
                                            </div>
                                            <div>
                                                <div class="text-xs font-bold">${asset.name}</div>
                                                <div class="text-[8px] text-pplx-muted uppercase font-bold">${asset.type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-8 py-4 text-right text-xs font-bold">€${asset.value.toLocaleString()}</td>
                                    <td class="px-8 py-4 text-right">
                                        <div class="text-[9px] font-bold ${asset.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}">
                                            ${asset.change >= 0 ? '+' : ''}${asset.change}%
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Sidebar (Right 1/3) -->
        <div class="lg:col-span-4 flex flex-col gap-10">
            <!-- Allocation Chart -->
            <div class="premium-card p-8">
                <h3 class="text-[11px] font-bold text-pplx-muted uppercase tracking-widest mb-8">Asset Allocation</h3>
                <div class="relative h-64">
                    <canvas id="allocationChart"></canvas>
                    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div class="text-4xl font-black text-pplx-text">${assets.length}</div>
                        <div class="text-[8px] font-bold text-pplx-muted uppercase tracking-widest">Assets</div>
                    </div>
                </div>
            </div>

            <!-- Sector Exposure -->
            <div class="premium-card p-8">
                <h3 class="text-[11px] font-bold text-pplx-muted uppercase tracking-widest mb-8">Sector Exposure</h3>
                <div class="h-64">
                    <canvas id="sectorChart"></canvas>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Performance Chart
        const perfCtx = document.getElementById('performanceChart').getContext('2d');
        new Chart(perfCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(performance.map((p: any) => p.month))},
                datasets: [{
                    label: 'Portfolio Value',
                    data: ${JSON.stringify(performance.map((p: any) => p.value))},
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 8 }, color: '#9B9B9B' } },
                    y: { grid: { color: '${isDark ? '#333' : '#f1f1f1'}' }, ticks: { font: { size: 8 }, color: '#9B9B9B' } }
                }
            }
        });

        // Allocation Chart
        const allocCtx = document.getElementById('allocationChart').getContext('2d');
        new Chart(allocCtx, {
            type: 'doughnut',
            data: {
                labels: ${JSON.stringify(assets.map((a: any) => a.ticker))},
                datasets: [{
                    data: ${JSON.stringify(assets.map((a: any) => a.value))},
                    backgroundColor: ['#1e293b', '#6366f1', '#3b82f6', '#f59e0b', '#94a3b8', '#ef4444', '#10b981', '#8b5cf6'],
                    borderWidth: 0,
                    cutout: '80%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });

        // Sector Chart
        const sectorCtx = document.getElementById('sectorChart').getContext('2d');
        new Chart(sectorCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(sectorData.map((s: any) => s.name.toUpperCase()))},
                datasets: [{
                    data: ${JSON.stringify(sectorData.map((s: any) => s.value))},
                    backgroundColor: '#3b82f6',
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { grid: { display: false }, ticks: { font: { size: 8, weight: 'bold' }, color: '#9B9B9B' } }
                }
            }
        });

        lucide.createIcons();
    </script>
    ${resizeScript}
</body>
</html>`;
    }

    if (widgetType === 'chart') {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chart Widget</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            margin: 0;
            padding: 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: ${isDark ? '#191919' : 'transparent'};
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            overflow: hidden;
            transform: scale(0.95);
            transform-origin: center center;
        }
        canvas {
            max-width: 100%;
            max-height: 100%;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
        }
    </style>
</head>
<body>
    <canvas id="myChart"></canvas>
    <script>
        try {
            const ctx = document.getElementById('myChart').getContext('2d');
            const config = ${JSON.stringify(config).replace(/</g, '\\u003c')};
            
            // Apply theme colors to Chart.js defaults
            Chart.defaults.color = '${textColor}';
            Chart.defaults.borderColor = '${gridColor}';
            
            if (config.options) {
                config.options.responsive = true;
                config.options.maintainAspectRatio = false;
                
                // Ensure scales use theme colors if they exist
                if (config.options.scales) {
                    Object.values(config.options.scales).forEach(scale => {
                        if (!scale.grid) scale.grid = {};
                        scale.grid.color = '${gridColor}';
                        if (!scale.ticks) scale.ticks = {};
                        scale.ticks.color = '${textColor}';
                    });
                }

                // Ensure plugins like legend use theme colors
                if (config.options.plugins) {
                    if (config.options.plugins.legend && config.options.plugins.legend.labels) {
                        config.options.plugins.legend.labels.color = '${textColor}';
                    }
                    if (config.options.plugins.title) {
                        config.options.plugins.title.color = '${textColor}';
                    }
                }
            } else {
                config.options = {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: '${textColor}' }
                        }
                    },
                    scales: {
                        x: { grid: { color: '${gridColor}' }, ticks: { color: '${textColor}' } },
                        y: { grid: { color: '${gridColor}' }, ticks: { color: '${textColor}' } }
                    }
                };
            }

            new Chart(ctx, config);
        } catch (error) {
            console.error('Error rendering chart:', error);
            document.body.innerHTML = '<div style="color: red; padding: 20px; background: white;">Error rendering chart: ' + error.message + '</div>';
        }
    </script>
    ${resizeScript}
</body>
</html>`;
    }

    if (widgetType === 'mermaid' || widgetType === 'diagram') {
        const mermaidCode = typeof config === 'string' ? config : (config.code || '');
        return `
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
    <style>
        body { 
            margin: 0; 
            padding: 24px; 
            display: flex; 
            justify-content: center; 
            background-color: ${isDark ? '#191919' : 'transparent'};
            color: ${textColor};
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            transform: scale(0.95);
            transform-origin: top center;
        }
        .mermaid {
            background-color: ${isDark ? '#191919' : 'transparent'};
            border-radius: 12px;
            padding: 16px;
        }
    </style>
</head>
<body>
    <pre class="mermaid">
${mermaidCode}
    </pre>
    <script>
        mermaid.initialize({ 
            startOnLoad: true, 
            theme: '${isDark ? 'dark' : 'default'}',
            securityLevel: 'loose',
            themeVariables: {
                darkMode: ${isDark},
                background: '${isDark ? '#191919' : '#transparent'}',
                primaryColor: '#20B8CD',
                mainBkg: '${isDark ? '#2d2d2d' : '#ffffff'}',
                nodeBorder: '${isDark ? '#444' : '#ccc'}',
                textColor: '${textColor}'
            }
        });
    </script>
    ${resizeScript}
</body>
</html>`;
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            font-family: sans-serif; 
            padding: 20px; 
            color: ${textColor}; 
            background-color: ${isDark ? '#191919' : 'transparent'};
        }
    </style>
</head>
<body>
    <div>Unsupported widget type: ${widgetType}</div>
    ${resizeScript}
</body>
</html>`;
}
