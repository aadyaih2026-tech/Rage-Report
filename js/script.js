const gameContainer = document.getElementById('game-container');
const scoreElement = document.querySelector('#score span');
const stopBtn = document.getElementById('stop-btn');
const rageMeterFill = document.getElementById('rage-meter-fill');
const satisfactionMeterFill = document.getElementById('satisfaction-meter-fill');

let totalGlassPieces = 0;
let objectsBroken = 0;
let isStopped = false;
let rageLevel = 0;
let satisfactionLevel = 0;
const maxMeter = 100;
let currentWeapon = 'rock';

const weapons = document.querySelectorAll('.weapon');
weapons.forEach(w => {
    w.addEventListener('click', () => {
        weapons.forEach(btn => btn.classList.remove('active'));
        w.classList.add('active');
        currentWeapon = w.dataset.weapon;
    });
});

// Drag and throw variables
let draggingGlass = null;
let dragStartX = 0;
let dragStartY = 0;
let glassStartX = 0;
let glassStartY = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let velX = 0;
let velY = 0;

// The requested minimalist glass objects
const shapes = [
    { 
        name: 'Glass bottle', 
        css: 'clip-path: polygon(40% 0%, 60% 0%, 60% 30%, 85% 45%, 85% 100%, 15% 100%, 15% 45%, 40% 30%);', 
        width: [80, 120], 
        height: [250, 320] 
    },
    { 
        name: 'Drinking glass', 
        css: 'clip-path: polygon(15% 0%, 85% 0%, 75% 100%, 25% 100%);', 
        width: [90, 130], 
        height: [150, 200] 
    },
    { 
        name: 'Mirror', 
        css: 'border-radius: 100px 100px 10px 10px;', 
        width: [120, 180], 
        height: [200, 300] 
    },
    { 
        name: 'Vase', 
        css: 'clip-path: polygon(30% 0%, 70% 0%, 60% 20%, 90% 60%, 60% 100%, 40% 100%, 10% 60%, 40% 20%);', 
        width: [120, 180], 
        height: [220, 280] 
    },
    { 
        name: 'Jar', 
        css: 'clip-path: polygon(25% 0%, 75% 0%, 75% 15%, 90% 25%, 90% 100%, 10% 100%, 10% 25%, 25% 15%);', 
        width: [120, 160], 
        height: [160, 220] 
    },
    { 
        name: 'Window', 
        css: 'border-radius: 4px; box-shadow: inset 0 0 20px rgba(255,255,255,0.2);', 
        width: [180, 280], 
        height: [220, 320] 
    },
    { 
        name: 'Glass cup', 
        css: 'clip-path: polygon(5% 0%, 95% 0%, 80% 100%, 20% 100%);', 
        width: [100, 140], 
        height: [100, 140] 
    }
];

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

function spawnGlass() {
    if (isStopped) return;
    
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    
    const glass = document.createElement('div');
    glass.classList.add('glass-object');
    glass.dataset.type = shape.name;
    
    const w = getRandom(shape.width[0], shape.width[1]);
    const h = getRandom(shape.height[0], shape.height[1]);
    
    glass.style.cssText += shape.css;
    glass.style.width = w + 'px';
    glass.style.height = h + 'px';
    
    // Position randomly on screen
    const maxX = window.innerWidth - w;
    const maxY = window.innerHeight - h;
    const posX = Math.max(0, Math.random() * maxX);
    const posY = Math.max(0, Math.random() * maxY);
    
    glass.style.left = posX + 'px';
    glass.style.top = posY + 'px';
    
    // Random rotation
    const rot = (Math.random() - 0.5) * 40;
    glass.dataset.rot = rot;
    
    glass.style.transform = `scale(0) rotate(${rot}deg)`;
    glass.style.opacity = '0';
    
    gameContainer.appendChild(glass);
    
    // Animate in
    requestAnimationFrame(() => {
        glass.style.transition = 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
        glass.style.transform = `scale(1) rotate(${rot}deg)`;
        glass.style.opacity = '1';
        
        setTimeout(() => {
            if(glass.parentNode) {
                glass.style.transition = 'transform 0.1s ease-out, background 0.2s';
            }
        }, 200);
    });
    
    const interact = (e) => {
        if (isStopped) return;
        e.preventDefault();
        let clientX = e.clientX;
        let clientY = e.clientY;
        if(e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        
        draggingGlass = glass;
        dragStartX = clientX;
        dragStartY = clientY;
        glassStartX = parseFloat(glass.style.left) || 0;
        glassStartY = parseFloat(glass.style.top) || 0;
        lastMouseX = clientX;
        lastMouseY = clientY;
        velX = 0;
        velY = 0;
        
        glass.style.transition = 'none'; // remove transition for smooth dragging
    };

    glass.addEventListener('mousedown', interact);
    glass.addEventListener('touchstart', interact, { passive: false });
}

function initialSpawn() {
        const currentGlasses = document.querySelectorAll('.glass-object').length;
        const area = window.innerWidth * window.innerHeight;
        const targetCount = Math.min(80, Math.floor(area / 15000));
        if(currentGlasses < targetCount) {
             for(let i=0; i < (targetCount - currentGlasses); i++) {
                 setTimeout(spawnGlass, Math.random() * 150);
             }
        }
}

let audioCtx = null;
let noiseBuffer = null;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        const bufferSize = audioCtx.sampleRate * 0.5; // 0.5 seconds
        noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1; // white noise
        }
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

document.body.addEventListener('mousedown', initAudio, { once: true });
document.body.addEventListener('touchstart', initAudio, { once: true });

function playThrowSound() {
    if (!audioCtx || isStopped) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}



function playGlassSound() {
    if (!audioCtx || isStopped) return;
    
    // Initial impact stone clack
    const clackOsc = audioCtx.createOscillator();
    const clackGain = audioCtx.createGain();
    clackOsc.type = 'square';
    clackOsc.connect(clackGain);
    clackGain.connect(audioCtx.destination);
    
    clackOsc.frequency.setValueAtTime(1500, audioCtx.currentTime);
    clackOsc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.05);
    
    clackGain.gain.setValueAtTime(1, audioCtx.currentTime);
    clackGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    
    clackOsc.start();
    clackOsc.stop(audioCtx.currentTime + 0.05);
    
    // Realistic glass shatter (white noise + highpass filter)
    if (noiseBuffer) {
        const noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 5000 + Math.random() * 2000; 
        
        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(1.5, audioCtx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noiseSource.start();
    }
}

function breakGlass(clientX, clientY, glass, shape, initialRot) {
    initAudio();
    playGlassSound();
    
    const pieceCount = 12 + Math.floor(Math.random() * 15);
    totalGlassPieces += pieceCount;
    objectsBroken += 1;
    scoreElement.innerText = totalGlassPieces;
    
    // Decrease rage, increase satisfaction
    rageLevel = Math.max(0, rageLevel - 20);
    satisfactionLevel = Math.min(maxMeter, satisfactionLevel + 15);
    updateMeters();
    
    const scoreParent = document.getElementById('score');
    scoreParent.style.transform = 'scale(1.1)';
    setTimeout(() => scoreParent.style.transform = 'scale(1)', 100);

    const rect = glass.getBoundingClientRect();
    
    // 4. Remove the broken object
    glass.remove();
    
    // 3. Create visible glass fragments flying outward
    for (let i = 0; i < pieceCount; i++) {
        createShard(rect, clientX, clientY, initialRot);
    }
    
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 100);
    
    triggerFunnyMessage();
    
    // 5. Generate a new random glass object
    // 6. Allow the user to immediately break the new object
    setTimeout(spawnGlass, 0);
}

function createShard(rect, clickX, clickY, baseRot) {
    const shard = document.createElement('div');
    shard.classList.add('shard');
    
    const offsetX = (Math.random() - 0.5) * rect.width * 0.8;
    const offsetY = (Math.random() - 0.5) * rect.height * 0.8;
    
    const w = 10 + Math.random() * 45;
    const h = 10 + Math.random() * 45;
    
    shard.style.width = w + 'px';
    shard.style.height = h + 'px';
    
    const startX = rect.left + rect.width / 2 + offsetX - w / 2;
    const startY = rect.top + rect.height / 2 + offsetY - h / 2;
    
    shard.style.left = startX + 'px';
    shard.style.top = startY + 'px';
    
    const points = [];
    const numPoints = 3 + Math.floor(Math.random() * 3);
    for(let j = 0; j < numPoints; j++) {
        points.push(`${Math.random() * 100}% ${Math.random() * 100}%`);
    }
    shard.style.clipPath = `polygon(${points.join(', ')})`;
    
    gameContainer.appendChild(shard);
    
    let dx = startX + w/2 - clickX;
    let dy = startY + h/2 - clickY;
    
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
    dx /= dist;
    dy /= dist;
    
    const force = 120 + Math.random() * 250 + (1500 / (dist + 10)); 
    
    const targetX = dx * force + (Math.random() - 0.5) * 200;
    const targetY = dy * force + (Math.random() - 0.5) * 200 + 500; // gravity effect
    const targetRot = baseRot + (Math.random() - 0.5) * 1200;
    
    shard.style.transform = `translate(0px, 0px) rotate(${baseRot}deg)`;
    
    requestAnimationFrame(() => {
        const duration = 0.4 + Math.random() * 0.5;
        shard.style.transition = `transform ${duration}s cubic-bezier(0.1, 0.9, 0.2, 1), opacity ${duration}s cubic-bezier(0.8, 0, 1, 1)`;
        shard.style.transform = `translate(${targetX}px, ${targetY}px) rotate(${targetRot}deg)`;
        shard.style.opacity = '0';
    });
    
    setTimeout(() => {
        shard.remove();
    }, 1000);
}

const handleMove = (e) => {
    if (!draggingGlass || isStopped) return;
    
    let clientX = e.clientX;
    let clientY = e.clientY;
    if(e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }
    
    const dx = clientX - dragStartX;
    const dy = clientY - dragStartY;
    
    draggingGlass.style.left = (glassStartX + dx) + 'px';
    draggingGlass.style.top = (glassStartY + dy) + 'px';
    
    velX = clientX - lastMouseX;
    velY = clientY - lastMouseY;
    
    lastMouseX = clientX;
    lastMouseY = clientY;
};

const handleEnd = (e) => {
    if (!draggingGlass || isStopped) return;
    
    const glass = draggingGlass;
    draggingGlass = null;
    
    if (Math.abs(velX) < 2 && Math.abs(velY) < 2) {
        throwWeaponAt(lastMouseX, lastMouseY, glass);
    } else {
        throwGlass(glass, velX, velY);
    }
};

function throwWeaponAt(targetX, targetY, glass) {
    playThrowSound();
    
    const projectile = document.createElement('div');
    projectile.classList.add(currentWeapon === 'rock' ? 'stone' : currentWeapon);
    
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight + 50;
    
    projectile.style.left = startX + 'px';
    projectile.style.top = startY + 'px';
    
    gameContainer.appendChild(projectile);
    
    let targetRotation = 0;
    if(currentWeapon === 'rock') targetRotation = Math.random() * 360;
    if(currentWeapon === 'hammer') targetRotation = 720 + Math.random() * 90;
    if(currentWeapon === 'rod') targetRotation = 1080;
    
    requestAnimationFrame(() => {
        projectile.style.transition = 'all 0.15s cubic-bezier(0.25, 1, 0.5, 1)';
        projectile.style.left = (targetX - 15) + 'px';
        projectile.style.top = (targetY - 15) + 'px';
        projectile.style.transform = `rotate(${targetRotation}deg) scale(${currentWeapon === 'rock' ? 0.8 : 1})`;
    });
    
    setTimeout(() => {
        if(glass.parentNode) {
            const shape = shapes.find(s => s.name === glass.dataset.type);
            breakGlass(targetX, targetY, glass, shape, parseFloat(glass.dataset.rot));
        }
        
        projectile.style.transition = 'all 0.4s ease-in';
        projectile.style.top = window.innerHeight + 100 + 'px';
        projectile.style.left = (targetX + (Math.random() - 0.5) * 300) + 'px';
        projectile.style.transform = `rotate(${targetRotation + 180}deg)`;
        
        setTimeout(() => projectile.remove(), 400);
    }, 150);
}

document.addEventListener('mousemove', handleMove);
document.addEventListener('touchmove', handleMove, { passive: false });
document.addEventListener('mouseup', handleEnd);
document.addEventListener('touchend', handleEnd);

function throwGlass(glass, vx, vy) {
    let x = parseFloat(glass.style.left) || 0;
    let y = parseFloat(glass.style.top) || 0;
    
    const animate = () => {
        if (!glass.parentNode) return;
        
        x += vx;
        y += vy;
        vy += 1.5; // gravity
        
        glass.style.left = x + 'px';
        glass.style.top = y + 'px';
        
        const rect = glass.getBoundingClientRect();
        if (x < -rect.width || x > window.innerWidth || y > window.innerHeight) {
            const shape = shapes.find(s => s.name === glass.dataset.type);
            breakGlass(x + rect.width/2, y + rect.height/2, glass, shape, parseFloat(glass.dataset.rot));
            return;
        }
        
        requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
}

const resultsScreen = document.getElementById('results-screen');
const finalScore = document.getElementById('final-score');
const trollMessage = document.getElementById('troll-message');
const resetBtn = document.getElementById('reset-btn');

stopBtn.addEventListener('click', () => {
    isStopped = true;
    
    // Stop all animations and remove objects
    gameContainer.innerHTML = '';
    
    let msg = "";
    if (totalGlassPieces < 100) {
        msg = "Congratulations. You barely have rage.";
    } else if (totalGlassPieces < 500) {
        msg = "Okay bro, we get it. You're angry.";
    } else if (totalGlassPieces < 2000) {
        msg = "Congratulations, your generational rage is ended! Hopefully.....";
    } else {
        msg = "Bro destroyed an entire civilization's glass supply.";
    }
    
    finalScore.innerText = totalGlassPieces;
    trollMessage.innerText = msg;
    resultsScreen.style.display = 'flex';
});

resetBtn.addEventListener('click', () => {
    // Reset state
    totalGlassPieces = 0;
    objectsBroken = 0;
    lastMilestone = 0;
    scoreElement.innerText = "0";
    isStopped = false;
    rageLevel = 0;
    satisfactionLevel = 0;
    updateMeters();
    
    // Hide results
    resultsScreen.style.display = 'none';
    
    // Restart
    initialSpawn();
});

setInterval(() => {
    if (!isStopped) {
        // Rage increases over time, satisfaction decreases
        rageLevel = Math.min(maxMeter, rageLevel + 0.5);
        satisfactionLevel = Math.max(0, satisfactionLevel - 0.2);
        updateMeters();
    }
}, 100);

function updateMeters() {
    if (rageMeterFill) rageMeterFill.style.height = `${rageLevel}%`;
    if (satisfactionMeterFill) satisfactionMeterFill.style.height = `${satisfactionLevel}%`;
    
    // Visual feedback for high rage
    if (rageLevel > 80) {
        rageMeterFill.style.boxShadow = '0 0 20px #ff3366, 0 0 40px #ff3366';
        if (Math.random() < 0.1) {
            document.body.classList.add('shake');
            setTimeout(() => document.body.classList.remove('shake'), 50);
        }
    } else {
        rageMeterFill.style.boxShadow = '0 0 10px #ff3366';
    }
}

// Start
initialSpawn();

const msgElem = document.getElementById('funny-message');
let isMessageShowing = false;

const messages = [
    "who hurt you bro??",
    "bro calm down 😭",
    "that was a perfectly good bottle.",
    "you good?",
    "another one??",
    "bro has beef with glass",
    "this is getting concerning",
    "WHY ARE YOU STILL HERE",
    "seek help bro",
    "bro has serious beef with glass",
    "there is literally nothing left to break",
    "you are the final boss of glass"
];

let lastMilestone = 0;

function triggerFunnyMessage() {
    const currentMilestone = Math.floor(totalGlassPieces / 100) * 100;
    
    // Trigger message every 100 pieces consistently
    if (currentMilestone > lastMilestone && currentMilestone > 0) {
        lastMilestone = currentMilestone;
        
        // Pick a message, scaling up in array based on milestone
        const baseIndex = Math.floor(currentMilestone / 300);
        const index = Math.min(messages.length - 1, baseIndex + Math.floor(Math.random() * 3));
        const msg = messages[index] || messages[messages.length - 1];
        
        isMessageShowing = true;
        msgElem.innerText = msg;
        msgElem.style.opacity = '1';
        msgElem.style.color = `#ffffff`;
        msgElem.style.transform = 'translate(-50%, -50%) scale(1)';
        
        setTimeout(() => {
            msgElem.style.opacity = '0';
            msgElem.style.transform = 'translate(-50%, -50%) scale(1.1)';
            setTimeout(() => isMessageShowing = false, 400);
        }, 3000);
    }
}

// ================= GESTURE THROWING (MEDIAPIPE) =================
const gestureVideo = document.getElementById('gesture-video');
const gestureCursor = document.getElementById('gesture-cursor');
const gestureToggleBtn = document.getElementById('gesture-toggle-btn');

let cameraInstance = null;
let handsInstance = null;
let isGestureActive = false;

// Gesture Tracking State
let lastHandX = 0;
let lastHandY = 0;
let lastTime = 0;
let throwCooldown = 0;

function initMediaPipe() {
    if (handsInstance) return;
    
    // Check if Hands is loaded from CDN
    if (typeof Hands === 'undefined') {
        alert("MediaPipe scripts are not loaded yet. Please wait a moment or check your internet connection.");
        return;
    }

    handsInstance = new Hands({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }});

    handsInstance.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
    });

    handsInstance.onResults(onGestureResults);
    
    cameraInstance = new Camera(gestureVideo, {
        onFrame: async () => {
            if (isGestureActive && handsInstance) {
                await handsInstance.send({image: gestureVideo});
            }
        },
        width: 640,
        height: 480
    });
}

function toggleGestureCamera() {
    if (isGestureActive) {
        // Stop
        isGestureActive = false;
        if (cameraInstance) {
            cameraInstance.stop();
        }
        if (gestureToggleBtn) gestureToggleBtn.classList.remove('active');
        if (gestureCursor) gestureCursor.style.display = 'none';
        if (gestureVideo) gestureVideo.srcObject = null;
    } else {
        // Start
        initMediaPipe();
        isGestureActive = true;
        if (gestureToggleBtn) gestureToggleBtn.classList.add('active');
        if (gestureCursor) gestureCursor.style.display = 'block';
        if (cameraInstance) {
            cameraInstance.start();
        }
    }
}

if (gestureToggleBtn) {
    gestureToggleBtn.addEventListener('click', toggleGestureCamera);
}

function onGestureResults(results) {
    if (!isGestureActive) return;
    if (isStopped) return;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // Use landmarks[9] (middle finger knuckle / palm center)
        const landmarks = results.multiHandLandmarks[0];
        const point = landmarks[9];
        
        // Map to screen (invert X for a mirror feel)
        const screenX = (1 - point.x) * window.innerWidth;
        const screenY = point.y * window.innerHeight;
        
        // Update cursor
        if (gestureCursor) {
            gestureCursor.style.left = screenX + 'px';
            gestureCursor.style.top = screenY + 'px';
        }
        
        // Calculate velocity (flick)
        const now = Date.now();
        if (lastTime > 0) {
            const dt = now - lastTime;
            const dx = screenX - lastHandX;
            const dy = screenY - lastHandY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const speed = dist / dt; // pixels per ms
            
            // If hand moves fast (e.g. speed > 2.5 px/ms) and cooldown is over
            if (speed > 2.5 && now > throwCooldown) {
                // Flick detected!
                if (gestureCursor) {
                    gestureCursor.classList.add('throwing');
                    setTimeout(() => gestureCursor.classList.remove('throwing'), 300);
                }
                
                throwCooldown = now + 400; // 400ms cooldown
                
                // Find nearest glass
                const nearest = getNearestGlass(screenX, screenY);
                if (nearest) {
                    throwWeaponAt(screenX, screenY, nearest);
                } else {
                    // Throw at screen coordinate anyway
                    const allGlass = document.querySelectorAll('.glass-object');
                    if (allGlass.length > 0) {
                        const randomGlass = allGlass[Math.floor(Math.random() * allGlass.length)];
                        throwWeaponAt(screenX, screenY, randomGlass);
                    }
                }
            }
        }
        
        lastHandX = screenX;
        lastHandY = screenY;
        lastTime = now;
    } else {
        lastTime = 0; // reset if hand lost
    }
}

function getNearestGlass(x, y) {
    const glasses = document.querySelectorAll('.glass-object');
    let nearest = null;
    let minDist = Infinity;
    
    glasses.forEach(g => {
        const rect = g.getBoundingClientRect();
        const gx = rect.left + rect.width / 2;
        const gy = rect.top + rect.height / 2;
        
        const dx = gx - x;
        const dy = gy - y;
        const dist = dx*dx + dy*dy;
        
        if (dist < minDist) {
            minDist = dist;
            nearest = g;
        }
    });
    
    // Only return if it's reasonably close (e.g. within 400px radius)
    if (minDist < 400 * 400) {
        return nearest;
    }
    return null;
}
