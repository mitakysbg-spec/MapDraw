const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');
const timerDisplay = document.getElementById('timer');
const palette = document.getElementById('palette');

const BOARD_SIZE = 1000;

// Цветове
const colors = [
    '#000000', '#ffffff', '#7e7e7e', '#bebebe', '#ed1c24', '#ff7f27', 
    '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4'
];
let selectedColor = colors[0];

// Начална позиция - центрирано на екрана
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

// Обновяване на позицията на екрана
function updateTransform() {
    // Ограничаваме мащаба, за да не стане прекалено малко или огромно
    scale = Math.max(0.1, Math.min(scale, 50));
    
    // Ограничаваме движението, за да не избяга платното напълно от екрана
    const maxMargin = BOARD_SIZE * scale;
    offsetX = Math.max(-maxMargin, Math.min(offsetX, window.innerWidth + maxMargin));
    offsetY = Math.max(-maxMargin, Math.min(offsetY, window.innerHeight + maxMargin));

    canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}
updateTransform();

// --- ВЛАЧЕНЕ ---
container.addEventListener('mousedown', (e) => {
    // Влачене със заDuration Ляв бутон, Скрол или Shift
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

// --- КОРИГИРАН ZOOM (МАСЩАБИРАНЕ) ---
container.addEventListener('wheel', (e) => {
    e.preventDefault();

    // Взимаме позицията на мишката в момента на скролване
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Намираме къде точно върху платното се намира мишката преди зуума
    const canvasMouseX = (mouseX - offsetX) / scale;
    const canvasMouseY = (mouseY - offsetY) / scale;

    // Определяме силата на зуум (по-нежно изменение)
    const zoomFactor = 1.1;
    if (e.deltaY < 0) {
        scale *= zoomFactor; // Zoom in
    } else {
        scale /= zoomFactor; // Zoom out
    }

    // Преизчисляваме офсета, така че точката под мишката да остане на същото място
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

// Защита: Ако натиснеш бутона "R", платното се връща в центъра
window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
        scale = 1;
        offsetX = (window.innerWidth - BOARD_SIZE) / 2;
        offsetY = (window.innerHeight - BOARD_SIZE) / 2;
        updateTransform();
    }
});
