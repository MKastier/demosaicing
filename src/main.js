import { initImageImport } from './imageImport.js';
import { calculateMSE, calculatePSNR, calculateSSIM } from './metrics.js';

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

    const endTime = performance.now();
    const executionTime = (endTime - startTime).toFixed(2);

    if (debayeredData)
    {
        ctxDebayer.putImageData(debayeredData, 0, 0);

        const mse = calculateMSE(originalImageData, debayeredData);
        const psnr = calculatePSNR(mse);
        const ssim = calculateSSIM(originalImageData, debayeredData, width, height);

        document.getElementById('metricTime').textContent = `${executionTime} ms`;
        document.getElementById('metricMse').textContent = mse.toFixed(2);
        document.getElementById('metricPsnr').textContent = typeof psnr === 'number' || !isNaN(psnr) ? `${psnr} dB` : psnr;
        document.getElementById('metricSsim').textContent = ssim;
    }
});

function bayerMask(imageData, width, height)
{
    const output = new ImageData(width, height);
    const inData = imageData.data;
    const outData = output.data;

    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {
            const i = (y * width + x) * 4;
            outData[i + 3] = inData[i + 3];

            if (y % 2 === 0)
            {
                if (x % 2 === 0)
                {
                    outData[i] = inData[i];
                }

                else
                {
                    outData[i + 1] = inData[i + 1];
                }
            }
            
            else
            {
                if (x % 2 === 0)
                {
                    outData[i + 1] = inData[i + 1];
                }

                else
                {
                    outData[i + 2] = inData[i + 2];
                }
            }
        }
    }

    return output;
}

function getPixelIndex(x, y, width, height)
{
    const X = Math.max(0, Math.min(width - 1, x));
    const Y = Math.max(0, Math.min(height - 1, y));

    return (Y * width + X) * 4;
}

function nearestNeighbor(bayerData, width, height)
{
    const output = new ImageData(width, height);
    const inData = bayerData.data;
    const outData = output.data;

    for (let y = 0; y < height; y++)
    {
        const isEvenRow = (y % 2 === 0);

        for (let x = 0; x < width; x++)
        {
            const i = (y * width + x) * 4;
            const isEvenCol = (x % 2 === 0);

            outData[i + 3] = 255;

            if (isEvenRow && isEvenCol)
            {
                outData[i]     = inData[i];
                outData[i + 1] = inData[getPixelIndex(x + 1, y, width, height) + 1];
                outData[i + 2] = inData[getPixelIndex(x + 1, y + 1, width, height) + 2];
            }

            else if (isEvenRow && !isEvenCol)
            {

                outData[i]     = inData[getPixelIndex(x - 1, y, width, height)];
                outData[i + 1] = inData[i + 1];
                outData[i + 2] = inData[getPixelIndex(x, y + 1, width, height) + 2];
            }

            else if (!isEvenRow && isEvenCol)
            {

                outData[i]     = inData[getPixelIndex(x, y - 1, width, height)];
                outData[i + 1] = inData[i + 1];
                outData[i + 2] = inData[getPixelIndex(x + 1, y, width, height) + 2];
            } 
            
            else
            {

                outData[i]     = inData[getPixelIndex(x - 1, y - 1, width, height)];
                outData[i + 1] = inData[getPixelIndex(x - 1, y, width, height) + 1];
                outData[i + 2] = inData[i + 2];
            }
        }
    }

    return output;
}

function bilinear(bayerData, width, height)
{
    const output = new ImageData(width, height);
    const inData = bayerData.data;
    const outData = output.data;

    for (let i = 0; i < inData.length; i++)
    {
        outData[i] = inData[i];
    }

    const getIdx = (x, y) => (y * width + x) * 4;

    for (let y = 1; y < height - 1; y++)
    {
        for (let x = 1; x < width - 1; x++)
        {
            const i = getIdx(x, y);
            const isEvenRow = (y % 2 === 0);
            const isEvenCol = (x % 2 === 0);

            if ((isEvenRow && isEvenCol) || (!isEvenRow && !isEvenCol))
            {
                outData[i + 1] = (inData[getIdx(x, y-1) + 1] + 
                                  inData[getIdx(x, y+1) + 1] + 
                                  inData[getIdx(x-1, y) + 1] + 
                                  inData[getIdx(x+1, y) + 1]) / 4;
            }

            if (!isEvenRow || !isEvenCol)
            {
                if (isEvenRow && !isEvenCol)
                {
                    outData[i] = (inData[getIdx(x-1, y)] + inData[getIdx(x+1, y)]) / 2;
                } 

                else if (!isEvenRow && isEvenCol)
                {
                    outData[i] = (inData[getIdx(x, y-1)] + inData[getIdx(x, y+1)]) / 2;
                } 

                else
                {
                    outData[i] = (inData[getIdx(x-1, y-1)] + inData[getIdx(x+1, y-1)] + 
                                  inData[getIdx(x-1, y+1)] + inData[getIdx(x+1, y+1)]) / 4;
                }
            }

            if (isEvenRow || isEvenCol)
            {
                if (!isEvenRow && isEvenCol)
                {
                    outData[i + 2] = (inData[getIdx(x-1, y) + 2] + inData[getIdx(x+1, y) + 2]) / 2;
                } 

                else if (isEvenRow && !isEvenCol)
                {
                    outData[i + 2] = (inData[getIdx(x, y-1) + 2] + inData[getIdx(x, y+1) + 2]) / 2;
                }

                else
                {
                    outData[i + 2] = (inData[getIdx(x-1, y-1) + 2] + inData[getIdx(x+1, y-1) + 2] + 
                                      inData[getIdx(x-1, y+1) + 2] + inData[getIdx(x+1, y+1) + 2]) / 4;
                }
            }
        }
    }

    return output;
}

