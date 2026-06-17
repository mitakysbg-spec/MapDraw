const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');
const timerDisplay = document.getElementById('timer');
const palette = document.getElementById('palette');
const centerBtn = document.getElementById('center-btn');

const BOARD_SIZE = 1000;

// Богата палитра от цветове
const colors = [
    '#000000', '#ffffff', '#7e7e7e', '#bebebe', '#ed1c24', '#ff7f27', 
    '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#b5e61d',
    '#ffca18', '#ffaec9', '#b97a57', '#b5e61d', '#efe4b0', '#000000'
];
let selectedColor = colors[0];

// Първоначално състояние - центрирано
let scale = 1;
let offsetX = (window.innerWidth - BOARD_SIZE) / 2;
let offsetY = (window.innerHeight - BOARD_SIZE) / 2;
let isDragging = false;
let startX, startY;
let cooldown = false;

// Генериране на палитрата
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

// ФУНКЦИЯ ЗА ОБНОВЯВАНЕ И ПРЕДОТВРАТЯВАНЕ НА ИЗЧЕЗВАНЕТО
function updateTransform() {
    // 1. Ограничаваме Zoom-а (Минимум 0.5x, Максимум 30x)
    // Това пречи на платното да стане микроскопично или твърде огромно
    scale = Math.max(0.5, Math.min(scale, 30));
    
    // 2. Ограничаваме движението (Drag)
    // Позволява платното да се мести, но винаги поне част от него да е на екрана
    const minX = window.innerWidth - (BOARD_SIZE * scale) - 100;
    const maxX = 100;
    const minY = window.innerHeight - (BOARD_SIZE * scale) - 100;
    const maxY = 100;

    // Ако платното е по-малко от екрана, променяме границите, за да не избяга
    offsetX = Math.max(Math.min(offsetX, window.innerWidth - 50), -(BOARD_SIZE * scale) + 50);
    offsetY = Math.max(Math.min(offsetY, window.innerHeight - 50), -(BOARD_SIZE * scale) + 50);

    // Прилагане на трансформацията
    canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

// Извикване за първоначално центриране
updateTransform();

// --- ВЛАЧЕНЕ (DRAG) ---
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

window.addEventListener('mouseup', () => { isDragging = false; });
window.addEventListener('mouseleave', () => { isDragging = false; });

// --- ПЛАВЕН И СИГУРЕН ZOOM ---
container.addEventListener('wheel', (e) => {
    e.preventDefault();

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Къде се намира мишката върху самото платно преди зуума
    const canvasMouseX = (mouseX - offsetX) / scale;
    const canvasMouseY = (mouseY - offsetY) / scale;

    // По-малка стъпка за много по-плавен преход
    const zoomFactor = 1.05; 
    
    if (e.deltaY < 0) {
        if (scale < 30) scale *= zoomFactor; // Zoom in
    } else {
        if (scale > 0.5) scale /= zoomFactor; // Zoom out
    }

    // Нагласяне на офсета, за да зуумва точно в мишката
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

// --- БУТОН ЦЕНТРИРАНЕ ---
function resetView() {
    scale = 1;
    offsetX = (window.innerWidth - BOARD_SIZE) / 2;
    offsetY = (window.innerHeight - BOARD_SIZE) / 2;
    updateTransform();
}
centerBtn.addEventListener('click', resetView);
