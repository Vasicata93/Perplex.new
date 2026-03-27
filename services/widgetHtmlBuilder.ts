export function buildWidgetHtml(widgetType: string, config: any, theme: 'light' | 'dark' = 'light'): string {
    const isDark = theme === 'dark';
    const textColor = isDark ? '#EBEBEB' : '#666666';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)';

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
            height: 100vh;
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
</body>
</html>`;
    }

    if (widgetType === 'mermaid' || widgetType === 'diagram') {
        const mermaidCode = typeof config === 'string' ? config : (config.code || '');
        return `
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
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
                background: '${isDark ? '#191919' : 'transparent'}',
                primaryColor: '#20B8CD',
                mainBkg: '${isDark ? '#2d2d2d' : '#ffffff'}',
                nodeBorder: '${isDark ? '#444' : '#ccc'}',
                textColor: '${textColor}'
            }
        });
    </script>
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
</body>
</html>`;
}
