const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');
const timerDisplay = document.getElementById('timer');
const palette = document.getElementById('palette');
const centerBtn = document.getElementById('center-btn');


//  500
const BOARD_SIZE = 500;
canvas.width = BOARD_SIZE;
canvas.height = BOARD_SIZE;

// Богата палитра
const colors = [
    '#000000', '#ffffff', '#7e7e7e', '#bebebe', '#ed1c24', '#ff7f27', 
    '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#b5e61d',
    '#ffca18', '#ffaec9', '#b97a57', '#e06666', '#f6b26b', '#ffd966'
];
let selectedColor = colors[0];

let scale = 1;
let offsetX = (window.innerWidth - BOARD_SIZE) / 2;
let offsetY = (window.innerHeight - BOARD_SIZE) / 2;
let isDragging = false;
let startX, startY;
let cooldown = false;

// Генериране на палитра
colors.forEach((color, index) => {
    const dot = document.createElement('div');
    dot.className = 'color-dot';
    dot.style.backgroundColor = color;
    if (index === 0) dot.classList.add('selected');
    
    dot.addEventListener('click', () => {
        document.querySelector('.color-dot.selected').classList.remove('selected');
        dot.classList.add('selected');
        selectedColor = color;
    });
    palette.appendChild(dot);
});

function updateTransform() {
    // Ограничаваме мащаба между 0.5x и 40x приближение
    scale = Math.max(0.5, Math.min(scale, 40));
    
    // Защита от излизане от екрана
    offsetX = Math.max(Math.min(offsetX, window.innerWidth - 50), -(BOARD_SIZE * scale) + 50);
    offsetY = Math.max(Math.min(offsetY, window.innerHeight - 50), -(BOARD_SIZE * scale) + 50);

    canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}
updateTransform();

// --- ВЛАЧЕНЕ ---
container.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    offsetX = e.clientX - startX;
    offsetY = e.clientY - startY;
    updateTransform();
});

window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('mouseleave', () => isDragging = false);

// --- ZOOM ---
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const canvasMouseX = (mouseX - offsetX) / scale;
    const canvasMouseY = (mouseY - offsetY) / scale;

    const zoomFactor = 1.1; 
    if (e.deltaY < 0) {
        if (scale < 40) scale *= zoomFactor;
    } else {
        if (scale > 0.5) scale /= zoomFactor;
    }

    offsetX = mouseX - canvasMouseX * scale;
    offsetY = mouseY * canvasMouseY * scale;

    updateTransform();
}, { passive: false });

// --- РИСУВАНЕ ---
canvas.addEventListener('click', (e) => {
    if (cooldown) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / scale);
    const y = Math.floor((e.clientY - rect.top) / scale);

    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
        ctx.fillStyle = selectedColor;
        // Рисува точно 1х1 пиксел в координатите
        ctx.fillRect(x, y, 1, 1);
        startCooldown();
    }
});

// --- ТАЙМЕР ---
function startCooldown() {
    cooldown = true;
    let timeLeft = 2;
    timerDisplay.innerText = `Изчакай: ${timeLeft}с`;

    const interval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(interval);
            cooldown = false;
            timerDisplay.innerText = "Готов за рисуване!";
        } else {
            timerDisplay.innerText = `Изчакай: ${timeLeft}с`;
        }
    }, 1000);
}

// --- ЦЕНТРИРАНЕ ---
function resetView() {
    scale = 1;
    offsetX = (window.innerWidth - BOARD_SIZE) / 2;
    offsetY = (window.innerHeight - BOARD_SIZE) / 2;
    updateTransform();
}
centerBtn.addEventListener('click', resetView);
