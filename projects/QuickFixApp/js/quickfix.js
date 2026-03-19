/* ── MAP SETUP ── */
/* global L */
const map = L.map('map', { zoomControl: true }).setView([60.4518, 22.2666], 14);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO',
    maxZoom: 18
}).addTo(map);

/* Mock mechanics in Turku */
const MECHANICS = [
    { id: 101, lat: 60.4565, lng: 22.2780, name: "Mikael V.", type: "E-Scooter Specialist", rating: "4.9", eta: "6m", dist: "0.9km", price: "42€" },
    { id: 102, lat: 60.4470, lng: 22.2520, name: "Jukka R.",  type: "Bike & E-Bike Expert",  rating: "4.7", eta: "9m", dist: "1.6km", price: "38€" },
    { id: 103, lat: 60.4590, lng: 22.2550, name: "Tommi K.", type: "Multi-Vehicle Tech",     rating: "4.8", eta: "11m", dist: "2.1km", price: "45€" },
];

/* Custom icons */
function makeIcon(emoji, color) {
    return L.divIcon({
        html: `<div style="
            background:${color};
            width:32px;height:32px;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:14px;
            box-shadow:0 4px 12px rgba(0,0,0,0.4);
            border:2px solid rgba(255,255,255,0.2);
        ">${emoji}</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
}

const mechanicIcon = makeIcon('🔧', 'rgba(16,185,129,0.9)');
const userIcon     = makeIcon('📍', 'rgba(228,168,0,0.9)');
const activeIcon   = makeIcon('🔧', 'rgba(228,168,0,0.95)');

/* Place mechanic markers */
const mechMarkers = {};
MECHANICS.forEach(m => {
    const marker = L.marker([m.lat, m.lng], { icon: mechanicIcon })
        .addTo(map)
        .bindPopup(`<strong>${m.name}</strong><br>${m.type}<br>⭐ ${m.rating}`);
    mechMarkers[m.id] = { marker, data: m };
});

/* ── STATE ── */
let state = "IDLE";
let userMarker  = null;
let routeLine   = null;
let pulseCircle = null;
let repairCircle = null;
let activeTimeouts = [];

function clearTimeouts() {
    activeTimeouts.forEach(t => clearTimeout(t));
    activeTimeouts = [];
}

function after(ms, fn) {
    const t = setTimeout(fn, ms);
    activeTimeouts.push(t);
    return t;
}

/* ── LOG ── */
const logBox = document.getElementById('log-box');

function addLog(text, type = 'system') {
    const el = document.createElement('span');
    el.className = `log-entry ${type}`;
    el.textContent = text;
    logBox.appendChild(el);
    logBox.scrollTop = logBox.scrollHeight;
}

/* ── STATUS UI ── */
function setStatus(key, msg) {
    const badge = document.getElementById('status-badge');
    badge.className = key;
    badge.textContent = key.toUpperCase().replace('-', ' ');
    document.getElementById('status-message').textContent = msg;
}

function setStep(stepId) {
    const steps = ['idle', 'matching', 'enroute', 'repairing', 'done'];
    const idx = steps.indexOf(stepId);
    steps.forEach((s, i) => {
        const el = document.getElementById(`step-${s}`);
        el.className = 'status-step';
        if (i < idx)      el.classList.add('done');
        else if (i === idx) el.classList.add('active');
    });
    document.getElementById('progress-bar').style.width =
        `${(idx / (steps.length - 1)) * 100}%`;
}

/* ── MAIN CLICK HANDLER ── */
map.on('click', function(e) {
    if (state !== "IDLE") return;
    startServiceFlow(e.latlng);
});

function startServiceFlow(userPos) {
    state = "RUNNING";
    document.getElementById('reset-btn').style.display = 'none';

    /* Clean up previous run */
    if (userMarker)   map.removeLayer(userMarker);
    if (routeLine)    map.removeLayer(routeLine);
    if (pulseCircle)  map.removeLayer(pulseCircle);
    if (repairCircle) map.removeLayer(repairCircle);
    logBox.innerHTML = '';

    /* Find nearest mechanic */
    let nearest = MECHANICS[0];
    let minDist = Infinity;
    MECHANICS.forEach(m => {
        const d = Math.hypot(m.lat - userPos.lat, m.lng - userPos.lng);
        if (d < minDist) { minDist = d; nearest = m; }
    });

    /* Place user marker + pulse ring */
    userMarker  = L.marker(userPos, { icon: userIcon }).addTo(map);
    pulseCircle = L.circle(userPos, {
        radius: 80, color: '#e4a800',
        fillColor: '#e4a800', fillOpacity: 0.15, weight: 2
    }).addTo(map);

    /* ── STATE 1: MATCHING ── */
    setStep('matching');
    setStatus('matching', 'Scanning for the nearest available mechanic...');
    addLog('[SYSTEM] QuickFix service request initiated', 'system');
    addLog(`[POST] /api/v1/request {lat: ${userPos.lat.toFixed(4)}, lng: ${userPos.lng.toFixed(4)}, vehicle: "e-scooter"}`, 'request');
    addLog('[GEO-QUERY] Scanning Firebase Realtime DB for active mechanics...', 'system');

    after(900, () => {
        addLog(`[GEO-MATCH] Found ${MECHANICS.length} mechanics within 3km radius`, 'match');
        addLog('[ALGO] Calculating ETA + distance scores...', 'system');
    });

    after(1800, () => {
        addLog(`[MATCH] Best match → Mechanic #${nearest.id} "${nearest.name}" (${nearest.dist}, ETA ${nearest.eta})`, 'match');

        /* Show mechanic card */
        const card = document.getElementById('mechanic-card');
        card.classList.add('visible');
        document.getElementById('mechanic-name').textContent  = `${nearest.name} · #${nearest.id}`;
        document.getElementById('mechanic-type').textContent  = `${nearest.type} · ⭐ ${nearest.rating}`;
        document.getElementById('stat-eta').textContent   = nearest.eta;
        document.getElementById('stat-dist').textContent  = nearest.dist;
        document.getElementById('stat-price').textContent = nearest.price;

        /* Highlight chosen mechanic */
        mechMarkers[nearest.id].marker.setIcon(activeIcon);

        /* ── STATE 2: EN ROUTE ── */
        setStep('enroute');
        setStatus('enroute', `${nearest.name} is heading to your location.`);

        routeLine = L.polyline([[nearest.lat, nearest.lng], userPos], {
            color: '#e4a800', weight: 3, dashArray: '8, 12', opacity: 0.8
        }).addTo(map);

        addLog(`[SOCKET] Mechanic_${nearest.id} accepted job. Emitting LAT_LNG_UPDATE...`, 'socket');
        addLog(`[SOCKET] 200 OK → {status: "matched", mechanic_id: ${nearest.id}, eta: "${nearest.eta}"}`, 'success');

        animateMechanic(nearest, userPos);

        after(5000, () => {
            /* ── STATE 3: REPAIRING ── */
            setStep('repairing');
            setStatus('repairing', `${nearest.name} has arrived. Diagnosing your e-scooter...`);

            if (routeLine) map.removeLayer(routeLine);
            repairCircle = L.circle(userPos, {
                radius: 40, color: '#7c3aed',
                fillColor: '#7c3aed', fillOpacity: 0.2, weight: 2
            }).addTo(map);

            addLog(`[SOCKET] Mechanic_${nearest.id} → status: "ARRIVED"`, 'socket');
            addLog('[SYSTEM] Repair timer started. Issue: Brake cable tension.', 'system');

            after(1000, () => addLog('[SYSTEM] Diagnostic complete. Fixing brake cable...', 'system'));
            after(2000, () => addLog('[SYSTEM] Parts used: Cable tie × 2, Brake pad × 1', 'system'));

            after(6000, () => {
                /* ── STATE 4: COMPLETED ── */
                setStep('done');
                setStatus('completed', `Repair complete! Payment of ${nearest.price} processed via Stripe.`);

                addLog(`[STRIPE] 201 CREATED → Invoice QF-${Math.floor(Math.random()*90000)+10000}-X`, 'success');
                addLog('[FIREBASE] Job record saved. Rating prompt sent to user.', 'success');
                addLog('[SYSTEM] Service completed in 8m 32s. SLA: ✓ PASSED', 'success');

                mechMarkers[nearest.id].marker.setIcon(mechanicIcon);
                if (repairCircle) map.removeLayer(repairCircle);

                const resetBtn = document.getElementById('reset-btn');
                resetBtn.style.display = '';
                resetBtn.classList.add('glow');
                state = "DONE";
                launchConfetti();
            });
        });
    });
}

/* ── ANIMATE MECHANIC ── */
function animateMechanic(mech, dest) {
    const steps = 20;
    const dlat  = (dest.lat - mech.lat) / steps;
    const dlng  = (dest.lng - mech.lng) / steps;
    let step = 0;

    function move() {
        if (step >= steps) return;
        step++;
        mechMarkers[mech.id].marker.setLatLng([
            mech.lat + dlat * step,
            mech.lng + dlng * step
        ]);
        after(250, move);
    }
    move();
}

/* ── RESET ── */
function resetDemo() {
    clearTimeouts();
    state = "IDLE";

    if (userMarker)   { map.removeLayer(userMarker);   userMarker   = null; }
    if (routeLine)    { map.removeLayer(routeLine);    routeLine    = null; }
    if (pulseCircle)  { map.removeLayer(pulseCircle);  pulseCircle  = null; }
    if (repairCircle) { map.removeLayer(repairCircle); repairCircle = null; }

    MECHANICS.forEach(m => {
        mechMarkers[m.id].marker.setLatLng([m.lat, m.lng]);
        mechMarkers[m.id].marker.setIcon(mechanicIcon);
    });

    setStep('idle');
    setStatus('idle', 'Click on the map to initiate a service request.');
    const badge = document.getElementById('status-badge');
    badge.className = '';
    badge.textContent = 'IDLE';

    document.getElementById('mechanic-card').classList.remove('visible');
    document.getElementById('reset-btn').classList.remove('glow');
    document.getElementById('reset-btn').style.display = 'none';
    logBox.innerHTML = '';
}

/* ── CONFETTI ── */
function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx    = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#e4a800','#7c3aed','#10b981','#3b82f6','#f59e0b','#ec4899'];
    const pieces = Array.from({ length: 120 }, () => ({
        x:     Math.random() * canvas.width,
        y:     -20,
        w:     Math.random() * 8  + 4,
        h:     Math.random() * 16 + 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx:    (Math.random() - 0.5) * 4,
        vy:    Math.random() * 4 + 2,
        angle: Math.random() * 360,
        va:    (Math.random() - 0.5) * 6,
    }));

    let frame;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        pieces.forEach(p => {
            if (p.y > canvas.height + 20) return;
            alive = true;
            p.x += p.vx; p.y += p.vy; p.angle += p.va; p.vy += 0.05;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle * Math.PI / 180);
            ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
        if (alive) frame = requestAnimationFrame(draw);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    draw();
    after(4000, () => {
        cancelAnimationFrame(frame);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
}