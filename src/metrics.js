export function calculateMSE(originalData, debayeredData)
{
    const orig = originalData.data;
    const debay = debayeredData.data;
    let sumSquaredDiff = 0;
    const totalPixels = orig.length / 4;

    for (let i = 0; i < orig.length; i += 4)
    {
        const diffR = orig[i] - debay[i];
        const diffG = orig[i + 1] - debay[i + 1];
        const diffB = orig[i + 2] - debay[i + 2];

        sumSquaredDiff += (diffR * diffR) + (diffG * diffG) + (diffB * diffB);
    }

    return sumSquaredDiff / (totalPixels * 3);
}

export function calculatePSNR(mse)
{
    if (mse === 0) return '∞ (Identický)';

    const maxSignal = 255.0;
    const psnr = 10 * Math.log10((maxSignal * maxSignal) / mse);

    return psnr.toFixed(2);
}

export function calculateSSIM(originalData, debayeredData, width, height)
{
    const orig = originalData.data;
    const debay = debayeredData.data;
    const totalPixels = width * height;

    const lum1 = new Float32Array(totalPixels);
    const lum2 = new Float32Array(totalPixels);

    for (let i = 0, p = 0; i < orig.length; i += 4, p++)
    {
        lum1[p] = 0.299 * orig[i] + 0.587 * orig[i + 1] + 0.114 * orig[i + 2];
        lum2[p] = 0.299 * debay[i] + 0.587 * debay[i + 1] + 0.114 * debay[i + 2];
    }

    const C1 = 6.5025;
    const C2 = 58.5225;
    const blockSize = 8;
    const N = blockSize * blockSize;

    let ssimSum = 0;
    let blockCount = 0;

    for (let y = 0; y <= height - blockSize; y += blockSize)
    {
        for (let x = 0; x <= width - blockSize; x += blockSize)
        {
            let sumX = 0, sumY = 0;

            for (let by = 0; by < blockSize; by++)
            {
                const row = (y + by) * width + x;
                for (let bx = 0; bx < blockSize; bx++)
                {
                    const idx = row + bx;
                    sumX += lum1[idx];
                    sumY += lum2[idx];
                }
            }

            const muX = sumX / N;
            const muY = sumY / N;

            let varX = 0, varY = 0, covXY = 0;

            for (let by = 0; by < blockSize; by++)
            {
                const row = (y + by) * width + x;

                for (let bx = 0; bx < blockSize; bx++)
                {
                    const idx = row + bx;
                    const dX = lum1[idx] - muX;
                    const dY = lum2[idx] - muY;
                    varX += dX * dX;
                    varY += dY * dY;
                    covXY += dX * dY;
                }
            }

            varX /= (N - 1);
            varY /= (N - 1);
            covXY /= (N - 1);

            const numerator = (2 * muX * muY + C1) * (2 * covXY + C2);
            const denominator = (muX * muX + muY * muY + C1) * (varX + varY + C2);

            ssimSum += (numerator / denominator);
            blockCount++;
        }
    }

    return blockCount > 0 ? (ssimSum / blockCount).toFixed(4) : '0';
}