const imageUpload = document.getElementById('imageUpload');
const processBtn = document.getElementById('processBtn');

const Original = document.getElementById('Original');
const Bayer = document.getElementById('Bayer');
const Debayer = document.getElementById('Debayer');

const ctxOriginal = Original.getContext('2d');
const ctxBayer = Bayer.getContext('2d');
const ctxDebayer = Debayer.getContext('2d');

let uploadedImage = new Image();

imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

uploadedImage.onload = () => {

    const w = uploadedImage.width;
    const h = uploadedImage.height;
    
    [Original, Bayer, Debayer].forEach(c => {
        c.width = w;
        c.height = h;
    });

    ctxOriginal.drawImage(uploadedImage, 0, 0);
    processBtn.disabled = false;
};

processBtn.addEventListener('click', () => {
    const width = Original.width;
    const height = Original.height;

    const originalImageData = ctxOriginal.getImageData(0, 0, width, height);
    
    const bayerImageData = applyBayerMask(originalImageData, width, height);
    ctxBayer.putImageData(bayerImageData, 0, 0);

    const debayeredData = applySimpleDebayer(bayerImageData, width, height);
    ctxDebayer.putImageData(debayeredData, 0, 0);
});

function applyBayerMask(imageData, width, height) {
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
                if (x % 2 === 0) {
                    outData[i] = inData[i];
                    outData[i+1] = 0;
                    outData[i+2] = 0;
                } else {
                    outData[i] = 0;
                    outData[i+1] = inData[i+1];
                    outData[i+2] = 0;
                }
            } 
            else 
              {
                if (x % 2 === 0)
                {
                  outData[i] = 0;
                  outData[i+1] = inData[i+1]; 
                  outData[i+2] = 0;
                } 
                else 
                {
                  outData[i] = 0;
                  outData[i+1] = 0;
                  outData[i+2] = inData[i+2];
                }
            }
        }
    }
    return output;
}

function applySimpleDebayer(bayerData, width, height) {
    const output = new ImageData(width, height);
    const inData = bayerData.data;
    const outData = output.data;

    for (let i = 0; i < inData.length; i++) {
        outData[i] = inData[i];
    }

    for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width - 1; x++) {
            const i = (y * width + x) * 4;
            
            if (outData[i] === 0) outData[i] = inData[i + 4];
            if (outData[i+1] === 0) outData[i+1] = inData[i + (width * 4) + 1];
            if (outData[i+2] === 0) outData[i+2] = inData[i + (width * 4) + 6];
        }
    }
    return output;
}

