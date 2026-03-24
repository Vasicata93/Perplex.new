export function buildWidgetHtml(widgetType: string, config: any): string {
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
            background-color: transparent;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
            const config = JSON.parse('${JSON.stringify(config).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/</g, '\\u003c')}');
            
            // Apply some default styling for dark/light mode compatibility if not specified
            if (config.options) {
                config.options.responsive = true;
                config.options.maintainAspectRatio = false;
            } else {
                config.options = {
                    responsive: true,
                    maintainAspectRatio: false
                };
            }

            new Chart(ctx, config);
        } catch (error) {
            console.error('Error rendering chart:', error);
            document.body.innerHTML = '<div style="color: red; padding: 20px;">Error rendering chart: ' + error.message + '</div>';
        }
    </script>
</body>
</html>`;
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <style>body { font-family: sans-serif; padding: 20px; color: #666; }</style>
</head>
<body>
    <div>Unsupported widget type: ${widgetType}</div>
</body>
</html>`;
}
