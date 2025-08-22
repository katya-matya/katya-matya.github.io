// Константы и переменные игры
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const doneBtn = document.getElementById('done-btn');
const electronCounter = document.getElementById('electron-counter');

const centerX = canvas.width / 2;
const centerY = canvas.height / 2 - 50;
const targetConfiguration = [2, 8, 10, 2];
const orbitRadiuses = [40, 80, 120, 160];
const orbitColors = ['#00ffff', '#00ff00', '#ff7700', '#cc00ff'];

// Область для свободных электронов
const freeElectronsArea = {
    x: 100,
    y: 400,
    width: 600,
    height: 80
};

let electrons = [];
let freeElectrons = [];
let draggedElectron = null;
let isDragging = false;
let offsetX, offsetY;
let animationId;

// Класс для электрона
class Electron {
    constructor(x, y, orbitLevel = null, angle = null) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.orbitLevel = orbitLevel;
        this.angle = angle || Math.random() * Math.PI * 2;
        this.color = orbitLevel !== null ? '#ffffff' : '#3399ff';
        this.glow = true;
        this.originalX = x;
        this.originalY = y;
        this.speed = orbitLevel !== null ? 0.01 + Math.random() * 0.01 : 0;
        this.isFree = orbitLevel === null;
        this.oscillationPhase = Math.random() * Math.PI * 2;
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Создание эффекта свечения
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0, 
            this.x, this.y, this.radius * 1.5
        );
        
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.7, this.color);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        if (this.glow) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;
        }
    }
    
    update() {
        if (this.orbitLevel !== null && this !== draggedElectron) {
            // Обновление позиции для электронов на орбиталях
            this.angle += this.speed;
            this.x = centerX + Math.cos(this.angle) * orbitRadiuses[this.orbitLevel];
            this.y = centerY + Math.sin(this.angle) * orbitRadiuses[this.orbitLevel];
        } else if (this.isFree && this !== draggedElectron) {
            // Легкое хаотичное движение для свободных электронов
            this.oscillationPhase += 0.05;
            this.x = this.originalX + Math.sin(this.oscillationPhase) * 3;
            this.y = this.originalY + Math.cos(this.oscillationPhase * 0.7) * 3;
        }
    }
    
    isPointInside(x, y) {
        return Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2) <= this.radius;
    }
}

// Инициализация игры
function initGame() {
    electrons = [];
    freeElectrons = [];
    
    // Создание электронов на орбиталях
    for (let level = 0; level < 4; level++) {
        const count = Math.floor(Math.random() * 6); // 0-5 электронов
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / Math.max(1, count)) * i;
            const x = centerX + Math.cos(angle) * orbitRadiuses[level];
            const y = centerY + Math.sin(angle) * orbitRadiuses[level];
            
            electrons.push(new Electron(x, y, level, angle));
        }
        
        // Обновление информации об уровне
        updateLevelInfo(level, count);
    }
    
    // Создание свободных электронов (35-40 штук)
    const totalElectrons = electrons.length;
    const neededElectrons = 35 + Math.floor(Math.random() * 6); // 35-40 электронов
    
    for (let i = 0; i < neededElectrons; i++) {
        const x = freeElectronsArea.x + Math.random() * freeElectronsArea.width;
        const y = freeElectronsArea.y + Math.random() * freeElectronsArea.height;
        
        const electron = new Electron(x, y);
        electron.isFree = true;
        freeElectrons.push(electron);
    }
    
    // Объединение всех электронов в один массив для отрисовки
    electrons = electrons.concat(freeElectrons);
}

// Отрисовка атома с прерывистыми орбиталями
function drawAtom() {
    // Отрисовка ядра
    const nucleusGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, 20
    );
    nucleusGradient.addColorStop(0, '#ffff00');
    nucleusGradient.addColorStop(1, '#ff0000');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fillStyle = nucleusGradient;
    ctx.fill();
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ff0000';
    
    // Отрисовка прерывистых орбиталей
    for (let i = 0; i < 4; i++) {
        ctx.setLineDash([5, 10]); // Прерывистая линия
        ctx.beginPath();
        ctx.arc(centerX, centerY, orbitRadiuses[i], 0, Math.PI * 2);
        ctx.strokeStyle = orbitColors[i];
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 15;
        ctx.shadowColor = orbitColors[i];
        ctx.setLineDash([]); // Сброс обратно к сплошной линии
    }
    
    ctx.shadowBlur = 0;
    
    // Отрисовка области свободных электронов
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.5)';
    ctx.strokeRect(freeElectronsArea.x, freeElectronsArea.y, freeElectronsArea.width, freeElectronsArea.height);
    ctx.setLineDash([]);
    
    // Подпись области свободных электронов
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(200, 200, 255, 0.7)';
    ctx.fillText('Free Electrons', freeElectronsArea.x + 10, freeElectronsArea.y - 10);
}

// Обновление информации об уровне
function updateLevelInfo(level, count) {
    const angle = Math.PI / 4 + (Math.PI / 2) * level;
    const infoX = centerX + Math.cos(angle) * (orbitRadiuses[level]);
    const infoY = centerY + Math.sin(angle) * (orbitRadiuses[level]);
    
    const infoElement = document.getElementById(`level${level+1}-info`);
    infoElement.textContent = `${count}`;
    infoElement.style.left = `${infoX}px`;
    infoElement.style.top = `${infoY}px`;
}

// Основной цикл анимации
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawAtom();
    
    // Обновление и отрисовка электронов
    electrons.forEach(electron => {
        if (electron !== draggedElectron) {
            electron.update();
        }
        electron.draw();
    });
    
    // Если перетаскиваем электрон, обновляем его позицию
    if (isDragging && draggedElectron) {
        draggedElectron.draw();
    }
    
    animationId = requestAnimationFrame(animate);
}

// Обработка начала перетаскивания
function handleDragStart(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Поиск электрона, по которому кликнули
    for (let i = 0; i < electrons.length; i++) {
        if (electrons[i].isPointInside(x, y)) {
            draggedElectron = electrons[i];
            isDragging = true;
            
            // Запоминаем смещение курсора относительно центра электрона
            offsetX = x - draggedElectron.x;
            offsetY = y - draggedElectron.y;
            
            // Увеличиваем электрон при перетаскивании
            draggedElectron.radius = 12;
            draggedElectron.glow = true;
            
            // Если электрон был на орбите, удаляем его оттуда
            if (draggedElectron.orbitLevel !== null) {
                const level = draggedElectron.orbitLevel;
                const currentCount = getElectronsOnLevel(level) - 1;
                updateLevelInfo(level, currentCount);
                
                draggedElectron.orbitLevel = null;
            }
            
            break;
        }
    }
}

// Обработка перемещения
function handleDragMove(e) {
    if (!isDragging || !draggedElectron) return;
    
    const rect = canvas.getBoundingClientRect();
    draggedElectron.x = e.clientX - rect.left - offsetX;
    draggedElectron.y = e.clientY - rect.top - offsetY;
}

// Обработка окончания перетаскивания
function handleDragEnd(e) {
    if (!isDragging || !draggedElectron) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - offsetX;
    const y = e.clientY - rect.top - offsetY;
    
    // Проверяем, над какой орбиталью отпустили электрон
    const distanceFromCenter = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
    );
    
    let droppedOnOrbit = false;
    
    for (let level = 0; level < 4; level++) {
        const minDist = orbitRadiuses[level] - 20;
        const maxDist = orbitRadiuses[level] + 20;
        
        if (distanceFromCenter >= minDist && distanceFromCenter <= maxDist) {
            // Проверяем, не превышает ли количество электронов максимальное для уровня
            const currentCount = getElectronsOnLevel(level);
            
            if (currentCount < (level === 0 ? 2 : level === 1 ? 8 : level === 2 ? 18 : 32)) {
                // Размещаем электрон на орбите
                draggedElectron.orbitLevel = level;
                draggedElectron.isFree = false;
                draggedElectron.angle = Math.atan2(y - centerY, x - centerX);
                draggedElectron.speed = 0.01 + Math.random() * 0.01;
                draggedElectron.originalX = x;
                draggedElectron.originalY = y;
                
                // Обновляем информацию об уровне
                updateLevelInfo(level, currentCount + 1);
                droppedOnOrbit = true;
            }
            break;
        }
    }
    
    // Если не попали на орбиталь, возвращаем электрон в область свободных электронов
    if (!droppedOnOrbit) {
        draggedElectron.isFree = true;
        draggedElectron.orbitLevel = null;
        
        // Проверяем, находится ли электрон в области свободных электронов
        const inFreeArea = (
            draggedElectron.x >= freeElectronsArea.x &&
            draggedElectron.x <= freeElectronsArea.x + freeElectronsArea.width &&
            draggedElectron.y >= freeElectronsArea.y &&
            draggedElectron.y <= freeElectronsArea.y + freeElectronsArea.height
        );
        
        if (!inFreeArea) {
            // Возвращаем в область свободных электронов
            draggedElectron.x = freeElectronsArea.x + Math.random() * freeElectronsArea.width;
            draggedElectron.y = freeElectronsArea.y + Math.random() * freeElectronsArea.height;
            draggedElectron.originalX = draggedElectron.x;
            draggedElectron.originalY = draggedElectron.y;
        }
    }
    
    // Восстанавливаем размер электрона
    draggedElectron.radius = 8;
    
    isDragging = false;
    draggedElectron = null;
}

// Получение количества электронов на уровне
function getElectronsOnLevel(level) {
    return electrons.filter(e => e.orbitLevel === level).length;
}

// Проверка конфигурации
function checkConfiguration() {
    const currentConfig = [];
    for (let i = 0; i < 4; i++) {
        currentConfig.push(getElectronsOnLevel(i));
    }
    
    const isCorrect = currentConfig.every((count, i) => count === targetConfiguration[i]);
    
    if (isCorrect) {
        victory();
    } else {
        // Эффект тряски кнопки
        doneBtn.classList.add('shake');
        setTimeout(() => doneBtn.classList.remove('shake'), 500);
    }
}

// Победа
function victory() {
    // Эффект пульсации орбит
    const originalRadiuses = [...orbitRadiuses];
    let scale = 1;
    let growing = true;
    
    const pulse = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем атом с пульсирующими орбитами
        drawAtom();
        
        // Изменяем размер орбит
        if (growing) {
            scale += 0.01;
            if (scale >= 1.1) growing = false;
        } else {
            scale -= 0.01;
            if (scale <= 0.9) growing = true;
        }
        
        for (let i = 0; i < 4; i++) {
            orbitRadiuses[i] = originalRadiuses[i] * scale;
        }
        
        // Обновляем и рисуем электроны
        electrons.forEach(electron => {
            electron.update();
            electron.draw();
        });
        
        animationId = requestAnimationFrame(pulse);
    };
    
    pulse();
    
    // Останавливаем пульсацию через 3 секунды
    setTimeout(() => {
        cancelAnimationFrame(animationId);
        for (let i = 0; i < 4; i++) {
            orbitRadiuses[i] = originalRadiuses[i];
        }
        
        // Показываем сообщение о победе
        alert("Configuration restored! Energy stabilized!");
    }, 3000);
}

// Инициализация обработчиков событий
function initEventListeners() {
    canvas.addEventListener('mousedown', handleDragStart);
    canvas.addEventListener('mousemove', handleDragMove);
    canvas.addEventListener('mouseup', handleDragEnd);
    
    // Для сенсорных устройств
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleDragStart(e.touches[0]);
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        handleDragMove(e.touches[0]);
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleDragEnd(e.changedTouches[0]);
    });
    
    doneBtn.addEventListener('click', checkConfiguration);
}

// Запуск игры
function startGame() {
    initGame();
    initEventListeners();
    animate();
}

// Запускаем игру при загрузке страницы
window.addEventListener('load', startGame);
