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
            const resizeObserver = new ResizeObserver(sendHeight);
            resizeObserver.observe(document.body);
            // Also send on any potential dynamic changes
            setInterval(sendHeight, 1000);
        </script>
    `;

    if (widgetType === 'portfolio-dashboard') {
        return `
<!DOCTYPE html>
<html lang="en" class="${isDark ? 'dark' : ''}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portfolio Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/lucide@0.321.0/dist/umd/lucide.min.js"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
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
            color: var(--tw-prose-body);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="bg-pplx-primary text-pplx-text p-4 md:p-8">
    <!-- Top Nav -->
    <div class="flex justify-between items-center mb-12 border-b border-pplx-border pb-4">
        <div class="flex items-center gap-4">
            <div class="w-8 h-8 bg-pplx-accent rounded-lg flex items-center justify-center text-white font-bold">D</div>
            <div class="text-sm font-bold tracking-tighter uppercase">The Digital Curator <span class="text-pplx-muted font-normal">| Dashboard Consolidat</span></div>
        </div>
        <div class="hidden md:flex items-center gap-6 text-[10px] font-bold text-pplx-muted uppercase tracking-widest">
            <a href="#" class="text-pplx-accent">Overview</a>
            <a href="#" class="hover:text-pplx-text transition-colors">Analytics</a>
            <a href="#" class="hover:text-pplx-text transition-colors">Reports</a>
            <a href="#" class="hover:text-pplx-text transition-colors">Settings</a>
        </div>
        <div class="flex items-center gap-4">
            <div class="w-2 h-2 rounded-full bg-pplx-accent animate-pulse"></div>
            <div class="text-[10px] font-bold text-pplx-muted uppercase tracking-widest">Live Market Data</div>
        </div>
    </div>

    <!-- Header Stats -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div>
            <div class="text-xs font-bold text-pplx-muted uppercase tracking-widest mb-1">Total Value</div>
            <div class="text-4xl md:text-5xl font-bold flex items-baseline gap-3">
                €1,420,500
                <span class="text-lg font-medium text-pplx-muted">Curated Overview</span>
            </div>
        </div>
        <div class="flex flex-wrap gap-8 items-center">
            <div class="text-right">
                <div class="text-[10px] font-bold text-pplx-muted uppercase tracking-wider mb-1">YTD Returns</div>
                <div class="text-pplx-accent font-bold text-lg">+12.4%</div>
            </div>
            <div class="text-right">
                <div class="text-[10px] font-bold text-pplx-muted uppercase tracking-wider mb-1">Last Month</div>
                <div class="text-pplx-accent font-bold text-lg">+4.2%</div>
            </div>
            <div class="text-right">
                <div class="text-[10px] font-bold text-pplx-muted uppercase tracking-wider mb-1">Volatility</div>
                <div class="text-pplx-text font-bold text-lg">8.4%</div>
            </div>
            <div class="flex gap-2 ml-4">
                <button class="px-4 py-1.5 text-xs font-bold border border-pplx-border rounded-md hover:bg-pplx-secondary transition-colors">EXPORT</button>
                <button class="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">NEW ENTRY</button>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content (Left 2/3) -->
        <div class="lg:col-span-2 flex flex-col gap-8">
            <!-- Asset Allocation Card -->
            <div class="bg-pplx-secondary border border-pplx-border rounded-2xl p-6 relative overflow-hidden">
                <div class="flex justify-center mb-8">
                    <div class="flex bg-pplx-primary border border-pplx-border rounded-lg p-1 text-[10px] font-bold uppercase tracking-wider">
                        <button class="px-4 py-1.5 bg-pplx-secondary rounded shadow-sm">Individual Assets</button>
                        <button class="px-4 py-1.5 hover:bg-pplx-secondary rounded transition-colors">Asset Classes</button>
                        <button class="px-4 py-1.5 hover:bg-pplx-secondary rounded transition-colors">Sectors</button>
                        <button class="px-4 py-1.5 hover:bg-pplx-secondary rounded transition-colors">Geographic</button>
                    </div>
                </div>

                <div class="flex flex-col md:flex-row items-center justify-center gap-12 py-4">
                    <div class="relative w-64 h-64">
                        <canvas id="allocationChart"></canvas>
                        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div class="text-4xl font-bold">12+</div>
                            <div class="text-[10px] font-bold text-pplx-muted uppercase tracking-widest">Holdings</div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col gap-3">
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-2 rounded-full bg-[#1e293b]"></div>
                            <div class="text-xs font-medium">AAPL (10.0%)</div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-2 rounded-full bg-[#6366f1]"></div>
                            <div class="text-xs font-medium">MSFT (7.0%)</div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-2 rounded-full bg-[#3b82f6]"></div>
                            <div class="text-xs font-medium">VUSA (14.8%)</div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                            <div class="text-xs font-medium">GOLD (8.0%)</div>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="w-2 h-2 rounded-full bg-[#94a3b8]"></div>
                            <div class="text-xs font-medium">OTHER (47.2%)</div>
                        </div>
                    </div>
                </div>

                <div class="mt-8 text-center">
                    <div class="text-xl font-bold mb-2">Active Allocation Strategy</div>
                    <div class="text-sm text-pplx-muted max-w-md mx-auto leading-relaxed">
                        Weighted towards core index trackers with strategic alpha overlays in technology and digital assets.
                    </div>
                </div>
            </div>

            <!-- Periodic Performance Card -->
            <div class="bg-pplx-secondary border border-pplx-border rounded-2xl p-6">
                <div class="flex justify-between items-center mb-8">
                    <div class="text-xs font-bold text-pplx-muted uppercase tracking-widest">Periodic Performance (12M)</div>
                    <div class="flex gap-4 items-center">
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full bg-pplx-accent"></div>
                            <div class="text-[10px] font-bold text-pplx-muted uppercase tracking-wider">Positive</div>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full bg-red-500"></div>
                            <div class="text-[10px] font-bold text-pplx-muted uppercase tracking-wider">Negative</div>
                        </div>
                    </div>
                </div>
                
                <div class="h-48 w-full">
                    <canvas id="performanceChart"></canvas>
                </div>

                <div class="mt-8 pt-6 border-t border-pplx-border text-center">
                    <button class="text-[10px] font-bold text-pplx-muted uppercase tracking-[0.2em] hover:text-pplx-text transition-colors">Explore Full History</button>
                </div>
            </div>
        </div>

        <!-- Sidebar (Right 1/3) -->
        <div class="flex flex-col gap-8">
            <!-- Active Strategies Card -->
            <div class="bg-pplx-secondary border border-pplx-border rounded-2xl p-6">
                <div class="text-xs font-bold text-pplx-muted uppercase tracking-widest mb-6">Active Strategies</div>
                <div class="flex flex-col gap-4">
                    <div class="bg-pplx-primary border border-pplx-border rounded-xl p-4">
                        <div class="flex justify-between items-center mb-2">
                            <div class="flex items-center gap-2">
                                <div class="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
                                    <div class="w-2 h-2 rounded-full bg-blue-600"></div>
                                </div>
                                <div class="text-sm font-bold">Momentum Alpha</div>
                            </div>
                            <div class="text-[8px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">Active</div>
                        </div>
                        <div class="text-[10px] text-pplx-muted leading-relaxed">Multi-factor trend following across global markets</div>
                    </div>

                    <div class="bg-pplx-primary border border-pplx-border rounded-xl p-4">
                        <div class="flex justify-between items-center mb-2">
                            <div class="flex items-center gap-2">
                                <div class="w-5 h-5 rounded bg-teal-100 flex items-center justify-center">
                                    <div class="w-2 h-2 rounded-full bg-teal-600"></div>
                                </div>
                                <div class="text-sm font-bold">Yield Guardian</div>
                            </div>
                            <div class="text-[8px] font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded uppercase">Defensive</div>
                        </div>
                        <div class="text-[10px] text-pplx-muted leading-relaxed">Income generation focus with capital protection</div>
                    </div>
                </div>
            </div>

            <!-- Portfolio Composite Card -->
            <div class="bg-pplx-secondary border border-pplx-border rounded-2xl p-6">
                <div class="flex justify-between items-center mb-6">
                    <div class="text-xs font-bold text-pplx-muted uppercase tracking-widest">Portofoliu Compozit</div>
                    <button class="text-[9px] font-bold text-blue-600 uppercase tracking-wider hover:underline">View All (42)</button>
                </div>

                <div class="flex flex-col gap-5">
                    <!-- Asset Item -->
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center">
                                <i data-lucide="apple" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <div class="text-xs font-bold">Apple Inc.</div>
                                <div class="text-[9px] text-pplx-muted uppercase font-medium">Tech / Equity</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs font-bold">€142,400</div>
                            <div class="text-[9px] text-pplx-accent font-bold">+0.4%</div>
                        </div>
                    </div>

                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
                                <i data-lucide="monitor" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <div class="text-xs font-bold">Microsoft Corp</div>
                                <div class="text-[9px] text-pplx-muted uppercase font-medium">Cloud / Equity</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs font-bold">€98,210</div>
                            <div class="text-[9px] text-pplx-accent font-bold">+1.2%</div>
                        </div>
                    </div>

                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-blue-800 text-white rounded-lg flex items-center justify-center">
                                <i data-lucide="trending-up" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <div class="text-xs font-bold">Vanguard S&P 500</div>
                                <div class="text-[9px] text-pplx-muted uppercase font-medium">ETF / Core</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs font-bold">€210,000</div>
                            <div class="text-[9px] text-pplx-accent font-bold">+2.1%</div>
                        </div>
                    </div>

                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-amber-500 text-white rounded-lg flex items-center justify-center">
                                <i data-lucide="gem" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <div class="text-xs font-bold">iShares Gold</div>
                                <div class="text-[9px] text-pplx-muted uppercase font-medium">Comm / Hedge</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs font-bold">€122,800</div>
                            <div class="text-[9px] text-pplx-muted font-bold">0.0%</div>
                        </div>
                    </div>

                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-orange-600 text-white rounded-lg flex items-center justify-center">
                                <i data-lucide="bitcoin" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <div class="text-xs font-bold">Bitcoin</div>
                                <div class="text-[9px] text-pplx-muted uppercase font-medium">Crypto / Spec</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs font-bold">€45,200</div>
                            <div class="text-[9px] text-pplx-accent font-bold">+5.4%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Allocation Donut Chart
        const allocationCtx = document.getElementById('allocationChart').getContext('2d');
        new Chart(allocationCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [10, 7, 14.8, 8, 47.2],
                    backgroundColor: ['#1e293b', '#6366f1', '#3b82f6', '#f59e0b', '#94a3b8'],
                    borderWidth: 0,
                    cutout: '85%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });

        // Performance Bar Chart
        const performanceCtx = document.getElementById('performanceChart').getContext('2d');
        new Chart(performanceCtx, {
            type: 'bar',
            data: {
                labels: ['JUL 23', 'AUG 23', 'SEP 23', 'OCT 23', 'NOV 23', 'DEC 23', 'JAN 24', 'FEB 24', 'MAR 24', 'APR 24', 'MAY 24', 'JUN 24'],
                datasets: [{
                    data: [2.5, 3.1, -1.8, 4.2, 5.5, -0.8, 6.2, 3.8, 4.5, -2.1, 5.2, 4.8],
                    backgroundColor: (context) => {
                        const value = context.dataset.data[context.dataIndex];
                        return value >= 0 ? '#20B8CD' : '#EF4444';
                    },
                    borderRadius: 4,
                    barThickness: 24
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: true, grid: { display: false }, ticks: { font: { size: 8, weight: 'bold' }, color: '#9B9B9B' } },
                    y: { display: false }
                }
            }
        });

        // Initialize Lucide icons
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
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: ${isDark ? '#191919' : 'transparent'};
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            overflow: hidden;
        }
        canvas {
            max-width: 100%;
            max-height: 100%;
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
            padding: 20px; 
            display: flex; 
            justify-content: center; 
            background-color: ${isDark ? '#191919' : 'transparent'};
            color: ${textColor};
        }
        .mermaid {
            background-color: ${isDark ? '#191919' : 'transparent'};
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
