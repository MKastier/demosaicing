function getIdx(x, y, width, height)
{
    const cx = Math.max(0, Math.min(width - 1, x));
    const cy = Math.max(0, Math.min(height - 1, y));

    return (cy * width + cx) * 4;
}

export function bayerMask(imageData, width, height)
{
    const output = new ImageData(width, height);
    const inData = imageData.data;
    const outData = output.data;

    for (let y = 0; y < height; y++)
    {
        const isEvenRow = (y % 2 === 0);
        for (let x = 0; x < width; x++)
        {
            const i = (y * width + x) * 4;
            const isEvenCol = (x % 2 === 0);
            outData[i + 3] = inData[i + 3];

            if (isEvenRow)
            {
                if (isEvenCol)
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
                if (isEvenCol)
                {
                    outData[i + 1] = inData[i + 1];
                }
                else {
                    outData[i + 2] = inData[i + 2];
                }
            }
        }
    }
    return output;
}

export function nearestNeighbor(bayerData, width, height)
{
    const output = new ImageData(width, height);
    const inData = bayerData.data;
    const outData = output.data;

    for (let y = 0; y < height; y++) {
        const isEvenRow = (y % 2 === 0);
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const isEvenCol = (x % 2 === 0);
            outData[i + 3] = 255;

            if (isEvenRow && isEvenCol)
            {
                outData[i]     = inData[i];
                outData[i + 1] = inData[getIdx(x + 1, y, width, height) + 1];
                outData[i + 2] = inData[getIdx(x + 1, y + 1, width, height) + 2];
            }
            else if (isEvenRow && !isEvenCol)
            {
                outData[i]     = inData[getIdx(x - 1, y, width, height)];
                outData[i + 1] = inData[i + 1];
                outData[i + 2] = inData[getIdx(x, y + 1, width, height) + 2];
            }
            else if (!isEvenRow && isEvenCol)
            {
                outData[i]     = inData[getIdx(x, y - 1, width, height)];
                outData[i + 1] = inData[i + 1];
                outData[i + 2] = inData[getIdx(x + 1, y, width, height) + 2];
            }
            else
            {
                outData[i]     = inData[getIdx(x - 1, y - 1, width, height)];
                outData[i + 1] = inData[getIdx(x - 1, y, width, height) + 1];
                outData[i + 2] = inData[i + 2];
            }
        }
    }
    return output;
}

export function bilinear(bayerData, width, height)
{
    const output = new ImageData(width, height);
    const inData = bayerData.data;
    const outData = output.data;

    for (let i = 0; i < inData.length; i++) outData[i] = inData[i];

    for (let y = 1; y < height - 1; y++)
    {
        const isEvenRow = (y % 2 === 0);
        for (let x = 1; x < width - 1; x++)
        {
            const i = (y * width + x) * 4;
            const isEvenCol = (x % 2 === 0);

            if ((isEvenRow && isEvenCol) || (!isEvenRow && !isEvenCol))
            {
                outData[i + 1] = (inData[getIdx(x, y - 1, width, height) + 1] + 
                                  inData[getIdx(x, y + 1, width, height) + 1] + 
                                  inData[getIdx(x - 1, y, width, height) + 1] + 
                                  inData[getIdx(x + 1, y, width, height) + 1]) / 4;
            }

            if (!isEvenRow || !isEvenCol)
            {
                if (isEvenRow && !isEvenCol)
                {
                    outData[i] = (inData[getIdx(x - 1, y, width, height)] + inData[getIdx(x + 1, y, width, height)]) / 2;
                } 
                else if (!isEvenRow && isEvenCol)
                {
                    outData[i] = (inData[getIdx(x, y - 1, width, height)] + inData[getIdx(x, y + 1, width, height)]) / 2;
                }
                else
                {
                    outData[i] = (inData[getIdx(x - 1, y - 1, width, height)] + inData[getIdx(x + 1, y - 1, width, height)] + 
                                  inData[getIdx(x - 1, y + 1, width, height)] + inData[getIdx(x + 1, y + 1, width, height)]) / 4;
                }
            }

            if (isEvenRow || isEvenCol)
            {
                if (!isEvenRow && isEvenCol)
                {
                    outData[i + 2] = (inData[getIdx(x - 1, y, width, height) + 2] + inData[getIdx(x + 1, y, width, height) + 2]) / 2;
                }
                else if (isEvenRow && !isEvenCol)
                {
                    outData[i + 2] = (inData[getIdx(x, y - 1, width, height) + 2] + inData[getIdx(x, y + 1, width, height) + 2]) / 2;
                }
                else
                {
                    outData[i + 2] = (inData[getIdx(x - 1, y - 1, width, height) + 2] + inData[getIdx(x + 1, y - 1, width, height) + 2] + 
                                      inData[getIdx(x - 1, y + 1, width, height) + 2] + inData[getIdx(x + 1, y + 1, width, height) + 2]) / 4;
                }
            }
        }
    }
    return output;
}