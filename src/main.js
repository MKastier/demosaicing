import { initImageImport } from './imageImport.js';
import { calculateMSE, calculatePSNR, calculateSSIM } from './metrics.js';
import { bayerMask, nearestNeighbor, bilinear, hamiltonAdams } from './algorithms.js';

initImageImport();

const processBtn = document.getElementById('processBtn');
const algorithmSelect = document.getElementById('algorithmSelect');

const Original = document.getElementById('Original');
const Bayer = document.getElementById('Bayer');
const Debayer = document.getElementById('Debayer');

const ctxOriginal = Original.getContext('2d');
const ctxBayer = Bayer.getContext('2d');
const ctxDebayer = Debayer.getContext('2d');

processBtn.addEventListener('click', () => {
    const width = Original.width;
    const height = Original.height;

    const originalImageData = ctxOriginal.getImageData(0, 0, width, height);
    
    const bayerImageData = bayerMask(originalImageData, width, height);
    ctxBayer.putImageData(bayerImageData, 0, 0);

    const selectedAlgorithm = algorithmSelect.value;
    let debayeredData;

    const startTime = performance.now();

    if (selectedAlgorithm === 'nearest')
    {
        debayeredData = nearestNeighbor(bayerImageData, width, height);
    } 
    else if (selectedAlgorithm === 'bilinear')
    {
        debayeredData = bilinear(bayerImageData, width, height);
    }
    else if (selectedAlgorithm === 'ha')
    {
        debayeredData = hamiltonAdams(bayerImageData, width, height);
    }
    else if (selectedAlgorithm === 'mhc')
    {
        debayeredData = malvarHeCutler(bayerImageData, width, height);
    }

    const endTime = performance.now();
    const executionTime = (endTime - startTime).toFixed(2);

    if (debayeredData)
    {
        ctxDebayer.putImageData(debayeredData, 0, 0);

        const methodTitle = document.getElementById('currentMethodTitle');
        if (methodTitle)
        {
            methodTitle.textContent = algorithmSelect.options[algorithmSelect.selectedIndex].text;
        }

        const mse = calculateMSE(originalImageData, debayeredData);
        const psnr = calculatePSNR(mse);
        const ssim = calculateSSIM(originalImageData, debayeredData, width, height);

        document.getElementById('metricTime').textContent = `${executionTime} ms`;
        document.getElementById('metricMse').textContent = mse.toFixed(2);
        document.getElementById('metricPsnr').textContent = `${psnr} dB`;
        document.getElementById('metricSsim').textContent = ssim;
    }
});