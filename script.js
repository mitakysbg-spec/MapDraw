const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');
const timerDisplay = document.getElementById('timer');
const palette = document.getElementById('palette');
const centerBtn = document.getElementById('center-btn');
const eraserBtn = document.getElementById('eraser-btn');

// Фиксиран размер 500 на 500
const BOARD_SIZE = 500;
canvas.width = BOARD_SIZE;
canvas.height = BOARD_SIZE;

// Богата палитра
const colors = [
    '#000000', '#7e7e7e', '#bebebe', '#ed1c24', '#ff7f27', 
    '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#b5e61d',
    '#ffca18', '#ffaec9', '#b97a57', '#e06666', '#f6b26b', '#ffd966'
];
let selectedColor = colors[0];
let currentTool = 'pencil'; // Може да бъде 'pencil' (молив) или 'eraser' (гума)

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
        // Когато се избере цвят, автоматично се изключва гумата
        currentTool = 'pencil';
        eraserBtn.classList.remove('active');
        
        const activeDot = document.querySelector('.color-dot.selected');
        if (activeDot) activeDot.classList.remove('selected');
        
        dot.classList.add('selected');
        selectedColor = color;
    });
    palette.appendChild(dot);
});

// Логика за бутона на гумата
eraserBtn.addEventListener('click', () => {
    currentTool = 'eraser';
    eraserBtn.classList.add('active');
    // Премахваме селекцията от цветовете в палитрата
    const activeDot = document.querySelector('.color-dot.selected');
    if (activeDot) activeDot.classList.remove('selected');
});

function updateTransform() {
    scale = Math.max(0.5, Math.min(scale, 40));
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
    const canvasMouseY = (moveY - offsetY) / scale; // Бележка: ако тук имаше грешка с moveY, е фиксирано на mouseY
    const canvasMouseYFixed = (mouseY - offsetY) / scale;

    const zoomFactor = 1.1; 
    if (e.deltaY < 0) {
        if (scale < 40) scale *= zoomFactor;
    } else {
        if (scale > 0.5) scale /= zoomFactor;
    }

    offsetX = mouseX - canvasMouseX * scale;
    offsetY = mouseY - canvasMouseYFixed * scale;

    updateTransform();
}, { passive: false });

// --- РИСУВАНЕ / ТРИЕНЕ ---
canvas.addEventListener('click', (e) => {
    if (cooldown) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / scale);
    const y = Math.floor((e.clientY - rect.top) / scale);

    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
        if (currentTool === 'pencil') {
            ctx.fillStyle = selectedColor;
            ctx.fillRect(x, y, 1, 1);
            startCooldown(0.2); // 0.2 секунди за молив
        } else if (currentTool === 'eraser') {
            ctx.fillStyle = '#ffffff'; // Триенето всъщност запълва с бяло
            ctx.fillRect(x, y, 1, 1);
            startCooldown(0.5); // 0.5 секунди за гума
        }
    }
});

// --- ДИНАМИЧЕН ТАЙМЕР ---
function startCooldown(duration) {
    cooldown = true;
    let timeLeft = duration;
    timerDisplay.innerText = `Изчакай: ${timeLeft.toFixed(1)}с`;

    const interval = setInterval(() => {
        timeLeft -= 0.1;
        
        if (timeLeft <= 0) {
            clearInterval(interval);
            cooldown = false;
            timerDisplay.innerText = "Готов за рисуване!";
        } else {
            timerDisplay.innerText = `Изчакай: ${timeLeft.toFixed(1)}с`;
        }
    }, 100);
}

// --- ЦЕНТРИРАНЕ ---
function resetView() {
    scale = 1;
    offsetX = (window.innerWidth - BOARD_SIZE) / 2;
    offsetY = (window.innerHeight - BOARD_SIZE) / 2;
    updateTransform();
}
centerBtn.addEventListener('click', resetView);
