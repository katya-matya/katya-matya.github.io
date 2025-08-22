(() => {
    const TOTAL = 47;
    const COLORS = ["#ff6b6b", "#ffd166", "#06d6a0", "#4cc9f0", "#b28dff", "#f72585", "#ffa600"];
    const SPECIAL = new Set([1, 3, 16, 26]);
    const knocked = new Set();
    let score = 0;

    const field = document.getElementById('field');
    const scoreEl = document.getElementById('score');
    const totalEl = document.getElementById('total');
    const crosshair = document.getElementById('crosshair');
    const reticle = document.getElementById('reticle');
    const shotAudio = document.getElementById('shotAudio');
    const winModal = document.getElementById('winModal');
    const finishBtn = document.getElementById('finishBtn');
    totalEl.textContent = TOTAL;

    // generate balls
    for (let i = 1; i <= TOTAL; i++) {
        const b = document.createElement('div');
        b.className = 'ball';
        b.dataset.id = i;
        b.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
        const idSpan = document.createElement('div');
        idSpan.className = 'id';
        idSpan.textContent = i;
        b.appendChild(idSpan);
        field.appendChild(b);
    }

    // reticle pos
    let rx = window.innerWidth / 2,
        ry = window.innerHeight / 2;

    function updateReticlePos() {
        reticle.style.left = rx + 'px';
        reticle.style.top = ry + 'px';
    }
    updateReticlePos();

    // movement
    const pressed = {};
    window.addEventListener('keydown', e => {
        if (e.code === 'Space' && !e.repeat) {
            e.preventDefault();
            crosshair.classList.add('visible');
            reticle.classList.remove('zoomed');
            void reticle.offsetWidth;
            reticle.classList.add('zoomed');
        }
        pressed[e.code] = true;
    });
    window.addEventListener('keyup', e => {
        if (e.code === 'Space') {
            e.preventDefault();
            fire();
            crosshair.classList.remove('visible');
        }
        pressed[e.code] = false;
    });

    function loop() {
        if (crosshair.classList.contains('visible')) {
            const step = 4;
            if (pressed.ArrowUp) ry = Math.max(0, ry - step);
            if (pressed.ArrowDown) ry = Math.min(innerHeight, ry + step);
            if (pressed.ArrowLeft) rx = Math.max(0, rx - step);
            if (pressed.ArrowRight) rx = Math.min(innerWidth, rx + step);
            updateReticlePos();
        }
        requestAnimationFrame(loop);
    }
    loop();

    function fire() {
        shotAudio.currentTime = 0;
        shotAudio.play().catch(() => {});
        const rect = reticle.getBoundingClientRect();
        const cx = rect.left + rect.width / 2,
            cy = rect.top + rect.height / 2;
        const target = document.elementFromPoint(cx, cy);
        if (!target) return;
        const ball = target.closest('.ball');
        if (ball && !knocked.has(+ball.dataset.id)) {
            ball.classList.add('knocked');
            knocked.add(+ball.dataset.id);
            score++;
            scoreEl.textContent = score;
            if (hasSpecial()) specialCombinationAchieved();
            if (score === TOTAL) winModal.classList.add('show');
        }
    }

    function hasSpecial() {
        for (const id of SPECIAL)
            if (!knocked.has(id)) return false;
        return true;
    }

    function specialCombinationAchieved() {
        console.log("Секретная комбинация собрана!");
        specialCombinationAchieved = () => {};
    }

    finishBtn.onclick = () => winModal.classList.remove('show');
})();
