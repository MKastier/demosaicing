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

export function hamiltonAdams(bayerData, width, height)
{
    const output = new ImageData(width, height);
    const inData = bayerData.data;
    const outData = output.data;

    const val = (x, y, ch) => inData[getIdx(x, y, width, height) + ch];
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

    const G = new Float32Array(width * height);
    const getG = (x, y) => {
        const cx = Math.max(0, Math.min(width - 1, x));
        const cy = Math.max(0, Math.min(height - 1, y));
        return G[cy * width + cx];
    };

    for (let y = 0; y < height; y++)
    {
        const isEvenRow = (y % 2 === 0);
        for (let x = 0; x < width; x++) {
            const isEvenCol = (x % 2 === 0);
            const gIdx = y * width + x;

            if ((isEvenRow && !isEvenCol) || (!isEvenRow && isEvenCol))
            {
                G[gIdx] = val(x, y, 1);
            } 
            else
            {
                const ch = (isEvenRow && isEvenCol) ? 0 : 2;

                const dh = Math.abs(val(x - 1, y, 1) - val(x + 1, y, 1)) +
                           Math.abs(2 * val(x, y, ch) - val(x - 2, y, ch) - val(x + 2, y, ch));
                const dv = Math.abs(val(x, y - 1, 1) - val(x, y + 1, 1)) +
                           Math.abs(2 * val(x, y, ch) - val(x, y - 2, ch) - val(x, y + 2, ch));

                const gh = (val(x - 1, y, 1) + val(x + 1, y, 1)) / 2 +
                           (2 * val(x, y, ch) - val(x - 2, y, ch) - val(x + 2, y, ch)) / 4;
                const gv = (val(x, y - 1, 1) + val(x, y + 1, 1)) / 2 +
                           (2 * val(x, y, ch) - val(x, y - 2, ch) - val(x, y + 2, ch)) / 4;

                if (dh < dv)
                {
                    G[gIdx] = gh;
                } 
                else if (dv < dh)
                {
                    G[gIdx] = gv;
                }
                else
                {
                    G[gIdx] = (gh + gv) / 2;
                }
            }
        }
    }

    for (let y = 0; y < height; y++)
    {
        const isEvenRow = (y % 2 === 0);

        for (let x = 0; x < width; x++)
        {
            const i = (y * width + x) * 4;
            const isEvenCol = (x % 2 === 0);
            const curG = G[y * width + x];

            outData[i + 1] = clamp(curG);
            outData[i + 3] = 255;

            if (isEvenRow && isEvenCol)
            {
                outData[i] = val(x, y, 0);
                const diffB = ((val(x - 1, y - 1, 2) - getG(x - 1, y - 1)) +
                               (val(x + 1, y - 1, 2) - getG(x + 1, y - 1)) +
                               (val(x - 1, y + 1, 2) - getG(x - 1, y + 1)) +
                               (val(x + 1, y + 1, 2) - getG(x + 1, y + 1))) / 4;
                outData[i + 2] = clamp(curG + diffB);

            }
            else if (!isEvenRow && !isEvenCol)
            {
                outData[i + 2] = val(x, y, 2);
                const diffR = ((val(x - 1, y - 1, 0) - getG(x - 1, y - 1)) +
                               (val(x + 1, y - 1, 0) - getG(x + 1, y - 1)) +
                               (val(x - 1, y + 1, 0) - getG(x - 1, y + 1)) +
                               (val(x + 1, y + 1, 0) - getG(x + 1, y + 1))) / 4;
                outData[i] = clamp(curG + diffR);

            }
            else if (isEvenRow && !isEvenCol)
            {
                const diffR = ((val(x - 1, y, 0) - getG(x - 1, y)) + (val(x + 1, y, 0) - getG(x + 1, y))) / 2;
                const diffB = ((val(x, y - 1, 2) - getG(x, y - 1)) + (val(x, y + 1, 2) - getG(x, y + 1))) / 2;
                outData[i]     = clamp(curG + diffR);
                outData[i + 2] = clamp(curG + diffB);

            } 
            else
            {
                const diffB = ((val(x - 1, y, 2) - getG(x - 1, y)) + (val(x + 1, y, 2) - getG(x + 1, y))) / 2;
                const diffR = ((val(x, y - 1, 0) - getG(x, y - 1)) + (val(x, y + 1, 0) - getG(x, y + 1))) / 2;
                outData[i]     = clamp(curG + diffR);
                outData[i + 2] = clamp(curG + diffB);
            }
        }
    }

    return output;
}

export function malvarHeCutler(bayerData, width, height)
{
    const output = new ImageData(width, height);
    const inData = bayerData.data;
    const outData = output.data;

    const val = (x, y, ch) => inData[getIdx(x, y, width, height) + ch];
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

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
                outData[i] = val(x, y, 0);

                const gEst = (4 * val(x, y, 0) +
                              2 * (val(x - 1, y, 1) + val(x + 1, y, 1) + val(x, y - 1, 1) + val(x, y + 1, 1)) -
                              (val(x - 2, y, 0) + val(x + 2, y, 0) + val(x, y - 2, 0) + val(x, y + 2, 0))) / 8;
                outData[i + 1] = clamp(gEst);

                const bEst = (12 * val(x, y, 0) +
                              4 * (val(x - 1, y - 1, 2) + val(x + 1, y - 1, 2) + val(x - 1, y + 1, 2) + val(x + 1, y + 1, 2)) -
                              3 * (val(x - 2, y, 0) + val(x + 2, y, 0) + val(x, y - 2, 0) + val(x, y + 2, 0))) / 16;
                outData[i + 2] = clamp(bEst);

            }
            
            else if (!isEvenRow && !isEvenCol)
            {
                outData[i + 2] = val(x, y, 2);

                const gEst = (4 * val(x, y, 2) +
                              2 * (val(x - 1, y, 1) + val(x + 1, y, 1) + val(x, y - 1, 1) + val(x, y + 1, 1)) -
                              (val(x - 2, y, 2) + val(x + 2, y, 2) + val(x, y - 2, 2) + val(x, y + 2, 2))) / 8;
                outData[i + 1] = clamp(gEst);

                const rEst = (12 * val(x, y, 2) +
                              4 * (val(x - 1, y - 1, 0) + val(x + 1, y - 1, 0) + val(x - 1, y + 1, 0) + val(x + 1, y + 1, 0)) -
                              3 * (val(x - 2, y, 2) + val(x + 2, y, 2) + val(x, y - 2, 2) + val(x, y + 2, 2))) / 16;
                outData[i] = clamp(rEst);

            }
            
            else if (isEvenRow && !isEvenCol)
            {

                outData[i + 1] = val(x, y, 1);

                const rEst = (10 * val(x, y, 1) +
                              8 * (val(x - 1, y, 0) + val(x + 1, y, 0)) -
                              2 * (val(x - 2, y, 1) + val(x + 2, y, 1) +
                                   val(x - 1, y - 1, 1) + val(x + 1, y - 1, 1) + val(x - 1, y + 1, 1) + val(x + 1, y + 1, 1)) +
                              (val(x, y - 2, 1) + val(x, y + 2, 1))) / 16;
                outData[i] = clamp(rEst);

                const bEst = (10 * val(x, y, 1) +
                              8 * (val(x, y - 1, 2) + val(x, y + 1, 2)) -
                              2 * (val(x, y - 2, 1) + val(x, y + 2, 1) +
                                   val(x - 1, y - 1, 1) + val(x + 1, y - 1, 1) + val(x - 1, y + 1, 1) + val(x + 1, y + 1, 1)) +
                              (val(x - 2, y, 1) + val(x + 2, y, 1))) / 16;
                outData[i + 2] = clamp(bEst);

            }
            
            else
            {
                outData[i + 1] = val(x, y, 1);

                const rEst = (10 * val(x, y, 1) +
                              8 * (val(x, y - 1, 0) + val(x, y + 1, 0)) -
                              2 * (val(x, y - 2, 1) + val(x, y + 2, 1) +
                                   val(x - 1, y - 1, 1) + val(x + 1, y - 1, 1) + val(x - 1, y + 1, 1) + val(x + 1, y + 1, 1)) +
                              (val(x - 2, y, 1) + val(x + 2, y, 1))) / 16;
                outData[i] = clamp(rEst);

                const bEst = (10 * val(x, y, 1) +
                              8 * (val(x - 1, y, 2) + val(x + 1, y, 2)) -
                              2 * (val(x - 2, y, 1) + val(x + 2, y, 1) +
                                   val(x - 1, y - 1, 1) + val(x + 1, y - 1, 1) + val(x - 1, y + 1, 1) + val(x + 1, y + 1, 1)) +
                              (val(x, y - 2, 1) + val(x, y + 2, 1))) / 16;
                outData[i + 2] = clamp(bEst);
            }
        }
    }
    
    return output;
}