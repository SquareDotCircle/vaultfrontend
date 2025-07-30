// Simple, clean particle system
class SimpleParticles {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.lines = null;
        this.mouse = new THREE.Vector2();
        this.mouseWorld = new THREE.Vector3();
        
        // Settings
        this.particleCount = 1000;
        this.mode = 'orbit'; // orbit, attract, repel
        this.style = 'particles'; // particles, lines, both
        this.speed = 1.0;
        this.mouseInfluence = 100;
        
        // Animation
        this.time = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        
        this.init();
    }
    
    init() {
        console.log('🚀 Starting Simple Particle System...');
        
        if (!window.THREE) {
            console.error('❌ THREE.js not loaded');
            return;
        }
        
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.createParticles();
        this.setupControls();
        this.setupEvents();
        this.animate();
        
        console.log('✅ Particle system ready!');
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // Simple ambient light
        const light = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(light);
    }
    
    setupCamera() {
        const container = document.getElementById('container');
        this.camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            2000
        );
        this.camera.position.set(300, 200, 300);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupRenderer() {
        const container = document.getElementById('container');
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);
    }
    
    createParticles() {
        // Remove existing particles
        if (this.particles) {
            this.scene.remove(this.particles);
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }
        
        if (this.lines) {
            this.scene.remove(this.lines);
            this.lines.geometry.dispose();
            this.lines.material.dispose();
        }
        
        // Create particle geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        const velocities = new Float32Array(this.particleCount * 3);
        
        // Generate particles in a sphere
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // Random position in sphere
            const radius = 80 + Math.random() * 120;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Random velocity
            velocities[i3] = (Math.random() - 0.5) * 0.02;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
            
            // Orange gradient color
            const hue = 0.12 + Math.random() * 0.05;
            const color = new THREE.Color().setHSL(hue, 0.9, 0.6);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        // Create particles
        const particleMaterial = new THREE.PointsMaterial({
            size: 3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(geometry, particleMaterial);
        this.scene.add(this.particles);
        
        // Create connections
        this.createConnections();
        this.updateStyle();
        
        console.log(`✅ Created ${this.particleCount} particles`);
    }
    
    createConnections() {
        const positions = this.particles.geometry.attributes.position.array;
        const linePositions = [];
        const lineColors = [];
        const connectionDistance = 60;
        
        // Find nearby particles and connect them
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            const pos1 = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
            
            for (let j = i + 1; j < this.particleCount; j++) {
                const j3 = j * 3;
                const pos2 = new THREE.Vector3(positions[j3], positions[j3 + 1], positions[j3 + 2]);
                
                const distance = pos1.distanceTo(pos2);
                
                if (distance < connectionDistance) {
                    linePositions.push(pos1.x, pos1.y, pos1.z);
                    linePositions.push(pos2.x, pos2.y, pos2.z);
                    
                    const intensity = 1.0 - (distance / connectionDistance);
                    const color = new THREE.Color(0xffaa00).multiplyScalar(intensity * 0.5);
                    
                    lineColors.push(color.r, color.g, color.b);
                    lineColors.push(color.r, color.g, color.b);
                }
            }
        }
        
        if (linePositions.length > 0) {
            const lineGeometry = new THREE.BufferGeometry();
            lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
            
            const lineMaterial = new THREE.LineBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0.3,
                blending: THREE.AdditiveBlending
            });
            
            this.lines = new THREE.LineSegments(lineGeometry, lineMaterial);
            this.scene.add(this.lines);
        }
    }
    
    setupControls() {
        // Mode buttons
        document.getElementById('orbit-btn').onclick = () => this.setMode('orbit');
        document.getElementById('attract-btn').onclick = () => this.setMode('attract');
        document.getElementById('repel-btn').onclick = () => this.setMode('repel');
        
        // Style buttons
        document.getElementById('particles-btn').onclick = () => this.setStyle('particles');
        document.getElementById('lines-btn').onclick = () => this.setStyle('lines');
        document.getElementById('both-btn').onclick = () => this.setStyle('both');
        
        // Sliders
        const countSlider = document.getElementById('count-slider');
        countSlider.oninput = (e) => {
            this.particleCount = parseInt(e.target.value);
            document.getElementById('count-value').textContent = this.particleCount;
            this.createParticles();
        };
        
        const speedSlider = document.getElementById('speed-slider');
        speedSlider.oninput = (e) => {
            this.speed = parseFloat(e.target.value);
            document.getElementById('speed-value').textContent = this.speed.toFixed(1);
        };
    }
    
    setMode(mode) {
        this.mode = mode;
        
        // Update button states
        document.querySelectorAll('[id$="-btn"]').forEach(btn => {
            if (btn.id.includes('orbit') || btn.id.includes('attract') || btn.id.includes('repel')) {
                btn.classList.remove('active');
            }
        });
        document.getElementById(mode + '-btn').classList.add('active');
        
        console.log(`Mode set to: ${mode}`);
    }
    
    setStyle(style) {
        this.style = style;
        
        // Update button states
        document.querySelectorAll('[id$="-btn"]').forEach(btn => {
            if (btn.id.includes('particles') || btn.id.includes('lines') || btn.id.includes('both')) {
                btn.classList.remove('active');
            }
        });
        document.getElementById(style + '-btn').classList.add('active');
        
        this.updateStyle();
        console.log(`Style set to: ${style}`);
    }
    
    updateStyle() {
        if (!this.particles || !this.lines) return;
        
        switch (this.style) {
            case 'particles':
                this.particles.visible = true;
                this.lines.visible = false;
                break;
            case 'lines':
                this.particles.visible = false;
                this.lines.visible = true;
                break;
            case 'both':
                this.particles.visible = true;
                this.lines.visible = true;
                break;
        }
    }
    
    setupEvents() {
        const canvas = this.renderer.domElement;
        
        // Mouse tracking
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            
            // Simple mouse world position
            this.mouseWorld.set(
                this.mouse.x * 200,
                this.mouse.y * 200,
                0
            );
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            const container = document.getElementById('container');
            this.camera.aspect = container.clientWidth / container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(container.clientWidth, container.clientHeight);
        });
        
        // Basic camera rotation
        let isRotating = false;
        let lastMouseX = 0;
        
        canvas.addEventListener('mousedown', () => isRotating = true);
        canvas.addEventListener('mouseup', () => isRotating = false);
        canvas.addEventListener('mouseleave', () => isRotating = false);
        
        canvas.addEventListener('mousemove', (e) => {
            if (isRotating && this.mode === 'orbit') {
                const deltaX = e.clientX - lastMouseX;
                const rotationSpeed = 0.01;
                
                // Rotate camera around center
                const radius = this.camera.position.length();
                const theta = Math.atan2(this.camera.position.x, this.camera.position.z) + deltaX * rotationSpeed;
                
                this.camera.position.x = radius * Math.sin(theta);
                this.camera.position.z = radius * Math.cos(theta);
                this.camera.lookAt(0, 0, 0);
            }
            lastMouseX = e.clientX;
        });
    }
    
    updateParticles() {
        if (!this.particles) return;
        
        const positions = this.particles.geometry.attributes.position.array;
        const velocities = this.particles.geometry.attributes.velocity.array;
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // Get current position
            const x = positions[i3];
            const y = positions[i3 + 1];
            const z = positions[i3 + 2];
            
            // Apply mode-based forces
            if (this.mode === 'attract') {
                const dx = this.mouseWorld.x - x;
                const dy = this.mouseWorld.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.mouseInfluence) {
                    const force = (1.0 - distance / this.mouseInfluence) * 0.5;
                    velocities[i3] += (dx / distance) * force * 0.1;
                    velocities[i3 + 1] += (dy / distance) * force * 0.1;
                }
            } else if (this.mode === 'repel') {
                const dx = x - this.mouseWorld.x;
                const dy = y - this.mouseWorld.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.mouseInfluence) {
                    const force = (1.0 - distance / this.mouseInfluence) * 0.5;
                    velocities[i3] += (dx / distance) * force * 0.1;
                    velocities[i3 + 1] += (dy / distance) * force * 0.1;
                }
            }
            
            // Apply velocity
            positions[i3] += velocities[i3] * this.speed;
            positions[i3 + 1] += velocities[i3 + 1] * this.speed;
            positions[i3 + 2] += velocities[i3 + 2] * this.speed;
            
            // Add gentle floating motion
            positions[i3] += Math.sin(this.time + i * 0.1) * 0.02 * this.speed;
            positions[i3 + 1] += Math.cos(this.time * 1.1 + i * 0.1) * 0.02 * this.speed;
            positions[i3 + 2] += Math.sin(this.time * 0.7 + i * 0.1) * 0.02 * this.speed;
            
            // Apply damping
            velocities[i3] *= 0.99;
            velocities[i3 + 1] *= 0.99;
            velocities[i3 + 2] *= 0.99;
        }
        
        this.particles.geometry.attributes.position.needsUpdate = true;
    }
    
    updateStats() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            document.getElementById('fps').textContent = this.fps;
            document.getElementById('particle-count').textContent = this.particleCount;
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.016 * this.speed; // Roughly 60fps
        
        this.updateParticles();
        this.updateStats();
        
        // Auto-rotate camera in orbit mode
        if (this.mode === 'orbit') {
            const radius = this.camera.position.length();
            const theta = this.time * 0.2;
            this.camera.position.x = radius * Math.sin(theta);
            this.camera.position.z = radius * Math.cos(theta);
            this.camera.lookAt(0, 0, 0);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Start when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.particleSystem = new SimpleParticles();
}); 