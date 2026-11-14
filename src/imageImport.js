export function initImageImport()
{
    const imageUpload = document.getElementById('imageUpload');
    const clearBtn = document.getElementById('clearBtn');
    const fileLabel = document.getElementById('fileLabel');
    const processBtn = document.getElementById('processBtn');

    const Original = document.getElementById('Original');
    const Bayer = document.getElementById('Bayer');
    const Debayer = document.getElementById('Debayer');
    const ctxOriginal = Original.getContext('2d');

    const uploadedImage = new Image();

    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];

        if (file)
        {
            fileLabel.textContent = `📁 ${file.name}`;
            fileLabel.title = file.name;
            clearBtn.disabled = false;
        }

        else
        {
            resetApp();
            return;
        }

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

    clearBtn.addEventListener('click', () => {
        resetApp();
    });

    function resetApp() {
        imageUpload.value = '';
        fileLabel.textContent = '📁 Vybrať obrázok';
        fileLabel.removeAttribute('title');

        [Original, Bayer, Debayer].forEach(canvas => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.width = 0;
            canvas.height = 0;
        });

        processBtn.disabled = true;
        clearBtn.disabled = true;

        const metricsIds = [
            'ha-metricPsnr', 'ha-metricMse', 'ha-metricSsim', 'ha-metricTime',
            'mhc-metricPsnr', 'mhc-metricMse', 'mhc-metricSsim', 'mhc-metricTime'
        ];

        metricsIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = id.includes('Psnr') ? '-- dB' : (id.includes('Time') ? '-- ms' : '--');
            }
        });
    }
}