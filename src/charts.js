import Chart from 'chart.js/auto';
import { bayerMask, nearestNeighbor, bilinear, hamiltonAdams, malvarHeCutler } from './algorithms.js';
import { calculateMSE, calculatePSNR, calculateSSIM } from './metrics.js';

const barLabelsPlugin = {
    id: 'barLabels',
    afterDatasetsDraw(chart) {
        const { ctx, chartArea } = chart;
        const unit = chart.options.plugins.barLabels?.unit || '';

        chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            meta.data.forEach((bar, index) => {
                const value = dataset.data[index];
                const text = unit ? `${value} ${unit}` : `${value}`;
                
                const visibleBase = Math.min(bar.base, chartArea.bottom);
                const barHeight = visibleBase - bar.y;

                ctx.save();
                ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
                ctx.textAlign = 'center';

                if (barHeight > 20)
                {
                    ctx.fillStyle = '#ffffff';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, bar.x, bar.y + barHeight / 2);
                }
                
                else
                {
                    ctx.fillStyle = '#0f172a';
                    ctx.textBaseline = 'bottom';
                    ctx.fillText(text, bar.x, bar.y - 6);
                }

                ctx.restore();
            });
        });
    }
};

export function initChart()
{
    const staticCanvas = document.getElementById('StaticOriginal');
    if (!staticCanvas) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `${import.meta.env.BASE_URL}/imgs/kodim19.png`;

    img.onload = () => {
        const w = Math.max(2, Math.floor(img.width / 2) * 2);
        const h = Math.max(2, Math.floor(img.height / 2) * 2);
        staticCanvas.width = w;
        staticCanvas.height = h;
        const ctx = staticCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        runAllBenchmarks(staticCanvas);
    };

    img.onerror = () => {
        const w = 320;
        const h = 240;
        staticCanvas.width = w;
        staticCanvas.height = h;
        drawFallbackTestPattern(staticCanvas.getContext('2d'), w, h);
        runAllBenchmarks(staticCanvas);
    };
}

function drawFallbackTestPattern(ctx, w, h)
{
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#e2e8f0');
    grad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#0f172a';
    for (let x = 20; x < 140; x += 4) {
        ctx.fillRect(x, 20, 2, 90);
    }

    const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7'];
    colors.forEach((col, idx) => {
        ctx.fillStyle = col;
        ctx.fillRect(20 + idx * 24, 130, 24, 90);
    });

    const cx = 230, cy = 120;
    for (let r = 80; r > 4; r -= 5) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = (r % 10 === 0) ? '#ffffff' : '#1e293b';
        ctx.fill();
    }
}

function runAllBenchmarks(staticCanvas)
{
    const width = staticCanvas.width;
    const height = staticCanvas.height;
    const ctxOrig = staticCanvas.getContext('2d');
    const originalData = ctxOrig.getImageData(0, 0, width, height);
    const bayerData = bayerMask(originalData, width, height);

    const methods = [
        { short: 'NN', canvasId: 'CanvasNN', fn: nearestNeighbor, color: '#dc2626' },
        { short: 'BI', canvasId: 'CanvasBI', fn: bilinear, color: '#10b981' },
        { short: 'HA', canvasId: 'CanvasHA', fn: hamiltonAdams, color: '#f59e0b' },
        { short: 'MHC', canvasId: 'CanvasMHC', fn: malvarHeCutler, color: '#2563eb' }
    ];

    const results = methods.map(m => {
        const canvas = document.getElementById(m.canvasId);
        canvas.width = width;
        canvas.height = height;

        const t0 = performance.now();
        const resultData = m.fn(bayerData, width, height);
        const t1 = performance.now();

        canvas.getContext('2d').putImageData(resultData, 0, 0);

        const time = +(t1 - t0).toFixed(2);
        const mse = +calculateMSE(originalData, resultData).toFixed(2);
        const psnr = +parseFloat(calculatePSNR(mse)).toFixed(2);
        const ssim = +parseFloat(calculateSSIM(originalData, resultData, width, height)).toFixed(4);

        return { ...m, time, mse, psnr, ssim };
    });

    renderBenchmarkCharts(results);
}

function renderBenchmarkCharts(results) {
    const labels = results.map(r => r.short);
    const colors = results.map(r => r.color);

    const createChart = (canvasId, label, data, unit = '', beginAtZero = true) => {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label,
                    data,
                    backgroundColor: colors,
                    borderRadius: 6
                }]
            },
            plugins: [barLabelsPlugin],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    barLabels: { unit }
                },
                scales: {
                    y: {
                        beginAtZero,
                        grace: '12%'
                    }
                }
            }
        });
    };

    createChart('chartPsnr', 'PSNR', results.map(r => r.psnr), 'dB', false);
    createChart('chartMse', 'MSE', results.map(r => r.mse), '', true);
    createChart('chartSsim', 'SSIM', results.map(r => r.ssim), '', false);
    createChart('chartTime', 'Čas', results.map(r => r.time), 'ms', true);
}