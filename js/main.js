/* ============================================================
   1. Live Bougainvillea Canopy Particle Continuation
   ============================================================ */
(function() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const PETAL_COUNT = 40;
    const WIND_DRIFT = -0.3; // Gentle persistent drift across the alleyway walkway

    // Matched palette directly pulled from the highlights and shadows of your picture's bouquet tree
    const PALETTE = [
        'rgba(172, 28, 98, ',   /* Vibrant Flower Magenta Core */
        'rgba(120, 15, 68, ',   /* Deep Twilight Shadow Shade */
        'rgba(214, 62, 134, ',  /* Sunlit Petal Rim Pink */
        'rgba(90, 8, 52, '      /* Dark Ambient Branch Silhouette */
    ];

    function resizeCanvas() {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
    }

    class BougainvilleaPetal {
        constructor(isInitialLoad) {
            this.init(isInitialLoad);
        }

        init(isInitialLoad) {
            // Distribute across viewport height on first frame, otherwise generate just past the top border
            this.x = Math.random() * canvas.width;
            this.y = isInitialLoad ? Math.random() * canvas.height : -20;

            this.size = Math.random() * 8 + 5;
            this.speedY = Math.random() * 0.7 + 0.4;
            this.speedX = (Math.random() * 0.4 - 0.2) + WIND_DRIFT;

            this.colorBase = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            this.opacity = Math.random() * 0.4 + 0.45; // Enhanced alpha floor to avoid invisible renderings

            // Flutter parameters
            this.flip = Math.random();
            this.flipSpeed = Math.random() * 0.02 + 0.01;
            this.angle = Math.random() * Math.PI;
            this.swaySpeed = Math.random() * 0.015 + 0.005;
            this.swayOffset = Math.random() * Math.PI * 2;
        }

        update() {
            this.y += this.speedY;
            // Introduce responsive fluid air wave calculations via sine transformation
            this.x += this.speedX + Math.sin(this.y * this.swaySpeed + this.swayOffset) * 0.25;
            this.flip += this.flipSpeed;

            // Recycle object if it exits horizontal coordinates or passes past header limits
            if (this.y > canvas.height + 15 || this.x < -20 || this.x > canvas.width + 20) {
                this.init(false);
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            // Deform petal calculations horizontally to capture folding spatial aspects
            let currentWidth = this.size * Math.sin(this.flip);
            let currentHeight = this.size;

            if (Math.abs(currentWidth) > 0.1) {
                ctx.beginPath();
                // Draw realistic organic biological shapes rather than abstract mathematical squares
                ctx.moveTo(0, -currentHeight / 2);
                ctx.bezierCurveTo(currentWidth, -currentHeight / 2, currentWidth, currentHeight / 2, 0, currentHeight / 2);
                ctx.bezierCurveTo(-currentWidth, currentHeight / 2, -currentWidth, -currentHeight / 2, 0, -currentHeight / 2);

                ctx.fillStyle = this.colorBase + this.opacity + ')';
                ctx.fill();
            }
            ctx.restore();
        }
    }

    const petals = [];
    for (let i = 0; i < PETAL_COUNT; i++) {
        petals.push(new BougainvilleaPetal(true));
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        petals.forEach(petal => {
            petal.update();
            petal.draw();
        });

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();
})();

/* ============================================
2. TYPING ANIMATION
============================================ */
(function() {
    const roles = [
        'Data Engineer',
        'ML & AI Engineer',
        'Backend Developer',
        'Cloud Engineer',
        'Full-Stack Developer'
    ];
    const el = document.getElementById('typed-role');
    if (!el) return;
    let roleIndex = 0, charIndex = 0, deleting = false;

    function type() {
        const current = roles[roleIndex];
        if (!deleting) {
            el.textContent = current.slice(0, ++charIndex);
            if (charIndex === current.length) {
                deleting = true;
                setTimeout(type, 1800);
                return;
            }
        } else {
            el.textContent = current.slice(0, --charIndex);
            if (charIndex === 0) {
                deleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
            }
        }
        setTimeout(type, deleting ? 45 : 80);
    }
    setTimeout(type, 800);
})();

/* ============================================
3. SCROLL REVEAL — Intersection Observer
============================================ */
(function() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-up, .slide-in-left').forEach(el => observer.observe(el));
})();

/* ============================================
4. ANIMATED STAT COUNTERS
============================================ */
(function() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    const seen = new Set();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !seen.has(entry.target)) {
                seen.add(entry.target);
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                const suffix = el.dataset.suffix || '';
                const duration = 1200;
                const step = target / (duration / 16);
                let current = 0;

                const timer = setInterval(() => {
                    current = Math.min(current + step, target);
                    el.textContent = Math.floor(current).toLocaleString() + suffix;
                    if (current >= target) clearInterval(timer);
                }, 16);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
})();

/* ============================================
5. CURSOR DOT TRAIL
============================================ */
(function() {
    const dot = document.getElementById('cursorDot');
    if (!dot) return;
    let mouseX = 0, mouseY = 0;
    let dotX = 0, dotY = 0;

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animate() {
        dotX += (mouseX - dotX) * 0.15;
        dotY += (mouseY - dotY) * 0.15;
        dot.style.left = dotX + 'px';
        dot.style.top  = dotY + 'px';
        requestAnimationFrame(animate);
    }
    animate();

    if ('ontouchstart' in window) dot.style.display = 'none';
})();