// --- 1. FIREBASE КОНФИГУРАЦИЯ ---
const firebaseConfig = {
  apiKey: "AIzaSyANO5MIoy1sk2WoRVKaxVdCWwpF3Kismjo",
  authDomain: "my-pixel-canvas.firebaseapp.com",
  databaseURL: "https://my-pixel-canvas-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "my-pixel-canvas",
  storageBucket: "my-pixel-canvas.firebasestorage.app",
  messagingSenderId: "125785381535",
  appId: "1:125785381535:web:e330c42e375dcf9b4160aa"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const pixelsRef = database.ref('pixels');

// --- 2. НАСТРОЙКИ НА ПЛАТНОТО ---
const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-container');
const timerDisplay = document.getElementById('timer');
const palette = document.getElementById('palette');
const centerBtn = document.getElementById('center-btn');
const eraserBtn = document.getElementById('eraser-btn');

const BOARD_SIZE = 500; 
canvas.width = BOARD_SIZE;
canvas.height = BOARD_SIZE;

const colors = [
    '#000000', '#ffffff', '#7e7e7e', '#bebebe', '#ed1c24', '#ff7f27', 
    '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#b5e61d',
    '#ffca18', '#ffaec9', '#b97a57', '#e06666', '#f6b26b', '#ffd966'
];
let selectedColor = colors[0];
let currentTool = 'pencil'; 

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
    if (color === '#ffffff') dot.style.border = '1px solid #555';

    dot.addEventListener('click', () => {
        currentTool = 'pencil';
        eraserBtn.classList.remove('active');
        const activeDot = document.querySelector('.color-dot.selected');
        if (activeDot) activeDot.classList.remove('selected');
        dot.classList.add('selected');
        selectedColor = color;
    });
    palette.appendChild(dot);
});

eraserBtn.addEventListener('click', () => {
    currentTool = 'eraser';
    eraserBtn.classList.add('active');
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

// --- ZOOM (ФИКСИРАН) ---
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const canvasMouseX = (mouseX - offsetX) / scale;
    const canvasMouseY = (mouseY - offsetY) / scale; // Поправено от moveY на mouseY

    const zoomFactor = 1.1; 
    if (e.deltaY < 0) {
        if (scale < 40) scale *= zoomFactor;
    } else {
        if (scale > 0.5) scale /= zoomFactor;
    }
    scale = Math.max(0.5, Math.min(scale, 40));
    offsetX = mouseX - canvasMouseX * scale;
    offsetY = mouseY - canvasMouseY * scale;
    updateTransform();
}, { passive: false });

// --- РИСУВАНЕ / ТРИЕНЕ ---
canvas.addEventListener('click', (e) => {
    if (cooldown) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / scale);
    const y = Math.floor((e.clientY - rect.top) / scale);

    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
        const pixelKey = `x${x}_y${y}`;

        if (currentTool === 'pencil') {
            pixelsRef.child(pixelKey).set({ x: x, y: y, color: selectedColor });
            startCooldown(0.2); 
        } else if (currentTool === 'eraser') {
            pixelsRef.child(pixelKey).remove();
            startCooldown(0.5); 
        }
    }
});

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

// --- СЛУШАТЕЛИ ---
pixelsRef.on('child_added', (snapshot) => {
    const data = snapshot.val();
    ctx.fillStyle = data.color;
    ctx.fillRect(data.x, data.y, 1, 1);
});

pixelsRef.on('child_changed', (snapshot) => {
    const data = snapshot.val();
    ctx.fillStyle = data.color;
    ctx.fillRect(data.x, data.y, 1, 1);
});

pixelsRef.on('child_removed', (snapshot) => {
    const data = snapshot.val();
    ctx.clearRect(data.x, data.y, 1, 1);
});

function resetView() {
    scale = 1;
    offsetX = (window.innerWidth - BOARD_SIZE) / 2;
    offsetY = (window.innerHeight - BOARD_SIZE) / 2;
    updateTransform();
}
centerBtn.addEventListener('click', resetView);
