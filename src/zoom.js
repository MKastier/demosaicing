let zoom = 1;
let x = 0;
let y = 0;

let canvases = [];
let wrappers = [];
let zoomBtns = [];

function clamp()
{
    if (zoom <= 1 || wrappers.length === 0) {
        x = 0;
        y = 0;
        return;
    }
    const rect = wrappers[0].getBoundingClientRect();
    const maxX = (rect.width * (zoom - 1)) / 2;
    const maxY = (rect.height * (zoom - 1)) / 2;
    x = Math.max(-maxX, Math.min(maxX, x));
    y = Math.max(-maxY, Math.min(maxY, y));
}

function applyTransform()
{
    clamp();
    canvases.forEach(c => {
        c.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
    });
    wrappers.forEach(w => {
        w.classList.toggle('zoomed', zoom > 1);
    });
}

export function initZoom()
{
    canvases = [
        document.getElementById('Original'),
        document.getElementById('Bayer'),
        document.getElementById('Debayer')
    ];
    wrappers = canvases.map(c => c.parentElement);
    zoomBtns = document.querySelectorAll('.zoom-btn');

    let isDragging = false;
    let startX = 0;
    let startY = 0;

    zoomBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            zoom = Number(btn.dataset.zoom);
            zoomBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyTransform();
        });
    });

    wrappers.forEach(wrapper => {
        wrapper.addEventListener('mousedown', (e) => {
            if (zoom <= 1) return;
            isDragging = true;
            startX = e.clientX - x;
            startY = e.clientY - y;
        });

        wrapper.addEventListener('wheel', (e) => {
            if (canvases[0].width === 0) return;
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.25 : 0.8;
            zoom = Math.max(1, Math.min(24, +(zoom * factor).toFixed(2)));

            zoomBtns.forEach(b => {
                b.classList.toggle('active', Number(b.dataset.zoom) === zoom);
            });
            applyTransform();
        }, { passive: false });
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        x = e.clientX - startX;
        y = e.clientY - startY;
        applyTransform();
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

export function resetZoom()
{
    zoom = 1;
    x = 0;
    y = 0;
    zoomBtns.forEach(b => {
        b.classList.toggle('active', Number(b.dataset.zoom) === 1);
    });
    applyTransform();
}