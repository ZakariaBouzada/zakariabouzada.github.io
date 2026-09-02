/* ============================================================
   1. Live Bougainvillea Canopy Particle Continuation
   ============================================================ */
(function() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const profilePic = document.querySelector('.profile-pic');

    const PETAL_COUNT = 46;
    const BASE_DRIFT = -0.28; // Gentle persistent drift across the alleyway walkway

    // Matched palette directly pulled from the highlights and shadows of your picture's bouquet tree
    const PALETTE = [
        'rgba(172, 28, 98, ',   /* Vibrant Flower Magenta Core */
        'rgba(120, 15, 68, ',   /* Deep Twilight Shadow Shade */
        'rgba(214, 62, 134, ',  /* Sunlit Petal Rim Pink */
        'rgba(90, 8, 52, ',     /* Dark Ambient Branch Silhouette */
        'rgba(196, 90, 140, '   /* Warm mid-tone for variety */
    ];

    let originX = 0, originY = 0; // spawn point near the profile photo, so petals read as coming FROM the tree

    function resizeCanvas() {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
        updateOrigin();
    }

    function updateOrigin() {
        if (!profilePic) {
            originX = canvas.width * 0.22;
            originY = canvas.height * 0.35;
            return;
        }
        const picBox = profilePic.getBoundingClientRect();
        const canvasBox = canvas.getBoundingClientRect();
        originX = (picBox.left - canvasBox.left) + picBox.width * 0.85;
        originY = (picBox.top - canvasBox.top) + picBox.height * 0.15;
    }

    // Slow, layered sine waves so the wind reads as gusting rather than a constant mechanical drift
    let time = 0;
    function windGust() {
        return Math.sin(time * 0.0006) * 0.5 + Math.sin(time * 0.00023 + 1.5) * 0.3;
    }

    class BougainvilleaPetal {
        constructor(isInitialLoad) {
            this.init(isInitialLoad);
        }

        init(isInitialLoad) {
            const spawnFromTree = Math.random() < 0.55;

            if (isInitialLoad) {
                // Distribute across viewport on first frame so the header isn't empty on load
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
            } else if (spawnFromTree) {
                // Most respawns originate near the photo's canopy edge, not the top of the header
                this.x = originX + (Math.random() - 0.3) * 90;
                this.y = originY + (Math.random() - 0.5) * 70;
            } else {
                this.x = Math.random() * canvas.width;
                this.y = -20;
            }

            this.size = Math.random() * 7 + 4;
            this.speedY = Math.random() * 0.6 + 0.35;
            this.speedX = (Math.random() * 0.4 - 0.2) + BASE_DRIFT;

            this.colorBase = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            this.opacity = Math.random() * 0.4 + 0.45;

            // Depth cue: smaller petals sit "farther back" — softer, dimmer, blurred
            this.depth = this.size / 12; // roughly 0.33 - 0.9
            this.blur = (1 - this.depth) * 2.2;

            // Multi-axis tumble instead of a single horizontal squash, so petals read as 3D, not flat paper
            this.flip = Math.random() * Math.PI;
            this.flipSpeed = Math.random() * 0.02 + 0.008;
            this.tilt = Math.random() * Math.PI;
            this.tiltSpeed = Math.random() * 0.015 + 0.004;
            this.angle = Math.random() * Math.PI;
            this.spin = (Math.random() - 0.5) * 0.01;
            this.swaySpeed = Math.random() * 0.015 + 0.005;
            this.swayOffset = Math.random() * Math.PI * 2;

            // Most are lone bracts; some are 3-bract sprigs, like real bougainvillea clusters
            this.cluster = Math.random() < 0.3 ? 3 : 1;
        }

        update(gust) {
            this.y += this.speedY * (0.7 + this.depth * 0.6);
            this.x += this.speedX + gust + Math.sin(this.y * this.swaySpeed + this.swayOffset) * 0.25;
            this.flip += this.flipSpeed;
            this.tilt += this.tiltSpeed;
            this.angle += this.spin;

            // Recycle object if it exits horizontal coordinates or passes past header limits
            if (this.y > canvas.height + 15 || this.x < -30 || this.x > canvas.width + 30) {
                this.init(false);
            }
        }

        drawBract(offsetAngle, scale) {
            const w = this.size * scale * Math.sin(this.flip);
            const h = this.size * scale * (0.85 + 0.15 * Math.cos(this.tilt));

            ctx.save();
            ctx.rotate(offsetAngle);
            if (Math.abs(w) > 0.08) {
                ctx.beginPath();
                // Papery, tapered bract shape — bougainvillea bracts come to a point, unlike round petals
                ctx.moveTo(0, -h / 2);
                ctx.quadraticCurveTo(w, -h * 0.15, w * 0.7, h * 0.35);
                ctx.quadraticCurveTo(w * 0.2, h / 2, 0, h / 2);
                ctx.quadraticCurveTo(-w * 0.2, h / 2, -w * 0.7, h * 0.35);
                ctx.quadraticCurveTo(-w, -h * 0.15, 0, -h / 2);
                ctx.closePath();
                ctx.fillStyle = this.colorBase + this.opacity + ')';
                ctx.fill();
            }
            ctx.restore();
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.filter = this.blur > 0.15 ? `blur(${this.blur.toFixed(1)}px)` : 'none';

            if (this.cluster === 3) {
                this.drawBract(0, 1);
                this.drawBract((Math.PI * 2) / 3, 0.75);
                this.drawBract(-(Math.PI * 2) / 3, 0.75);
            } else {
                this.drawBract(0, 1);
            }

            ctx.restore();
        }
    }

    const petals = [];
    for (let i = 0; i < PETAL_COUNT; i++) {
        petals.push(new BougainvilleaPetal(true));
    }

    function animate() {
        time += 16;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const gust = windGust();

        petals.forEach(petal => {
            petal.update(gust);
            petal.draw();
        });

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('load', updateOrigin);
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