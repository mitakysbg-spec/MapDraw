const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');
const timerDisplay = document.getElementById('timer');
const palette = document.getElementById('palette');

// Настройки на платното
const BOARD_SIZE = 1000;
const PIXEL_SIZE = 1; // 1 пиксел на екрана е 1 пиксел в матрицата

// Богата палитра от цветове
const colors = [
    '#000000', '#ffffff', '#7e7e7e', '#bebebe', '#22b14c', '#b5e61d',
    '#ed1c24', '#ff7f27', '#fff200', '#3f48cc', '#00a2e8', '#a349a4',
    '#c3c3c3', '#b97a57', '#ffaec9', '#ffca18', '#efe4b0', '#b5e61d'
];
let selectedColor = colors[0];

// Състояние на трансформацията (Zoom & Drag)
let scale = 1;
let offsetX = (window.innerWidth - BOARD_SIZE) / 2;
let offsetY = (window.innerHeight - BOARD_SIZE) / 2;
let isDragging = false;
let startX, startY;

// Състояние на таймера
let cooldown = false;
let cooldownTime = 2; // 2 секунди

// Инициализиране на палитрата
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

// Първоначално позициониране
function updatetransform() {
    canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}
updatetransform();

// --- ВЛАЧЕНЕ (DRAG) ---
container.addEventListener('mousedown', (e) => {
    if (e.button === 1 || e.shiftKey || e.target === container) { // Влачене с Wheel или Shift+Клик
        isDragging = true;
        startX = e.clientX - offsetX;
        startY = e.clientY - offsetY;
    }
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    offsetX = e.clientX - startX;
    offsetY = e.clientY - startY;
    updatetransform();
});

window.addEventListener('mouseup', () => { isDragging = false; });

// --- МАЩАБИРАНЕ (ZOOM) ---
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    
    // Позиция на мишката спрямо контейнера
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Логика за zoom спрямо позицията на мишката
    const canvasMouseX = (mouseX - offsetX) / scale;
    const canvasMouseY = (mouseY - offsetY) / scale;

    if (e.deltaY < 0) {
        scale *= zoomFactor;
    } else {
        scale /= zoomFactor;
    }
    
    // Ограничения на зуума
    scale = Math.max(0.5, Math.min(scale, 40));

    offsetX = mouseX - canvasMouseX * scale;
    offsetY = mouseY * canvasMouseY * scale;

    updatetransform();
}, { passive: false });

// --- РИСУВАНЕ ---
canvas.addEventListener('click', (e) => {
    if (cooldown) return; // Ако има таймер, не прави нищо

    // Взимане на точните координати на пиксела спрямо мащаба
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / scale);
    const y = Math.floor((e.clientY - rect.top) / scale);

    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
        drawPixel(x, y, selectedColor);
        startCooldown();
        
        // ТУК: В бъдеще ще изпращаш (x, y, selectedColor) към сървъра през WebSocket
    }
});

function drawPixel(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}

// --- ТАЙМЕР ---
function startCooldown() {
    cooldown = true;
    let timeLeft = cooldownTime;
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
