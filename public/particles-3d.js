class ParticleSystem3D {
    constructor() {
        // Core Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = null;
        this.mouse = new THREE.Vector2();
        this.mouseWorld = new THREE.Vector3();
        
        // Particle system
        this.particleSystem = null;
        this.connectionSystem = null;
        this.particles = [];
        this.connections = [];
        
        // Settings
        this.config = {
            particleCount: 800,
            connectionDistance: 60,
            animationSpeed: 1.0,
            interactionMode: 'orbit', // orbit, attract, repel
            visualStyle: 'particles', // particles, connections, both
            mouseInfluence: 80,
            captureRadius: 60
        };
        
        // State
        this.capturedParticles = [];
        this.isCapturing = false;
        this.stats = {
            fps: 0,
            frameCount: 0,
            lastTime: performance.now()
        };
        
        // Initialize
        this.init();
    }
    
    init() {
        console.log('🚀 Initializing Particle System 3D...');
        
        if (!window.THREE) {
            console.error('❌ THREE.js not loaded');
            return;
        }
        
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.setupRaycaster();
        this.createParticleSystem();
        this.setupEventListeners();
        this.setupUI();
        this.startAnimation();
        
        // Hide instructions after 5 seconds
        setTimeout(() => this.hideInstructions(), 5000);
        
        console.log('✅ Particle System 3D initialized successfully');
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        
        // Add subtle lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
        this.scene.add(ambientLight);
        
        const pointLight = new THREE.PointLight(0xffaa00, 0.3, 1000);
        pointLight.position.set(200, 200, 200);
        this.scene.add(pointLight);
    }
    
    setupCamera() {
        const container = document.getElementById('scene-container');
        this.camera = new THREE.PerspectiveCamera(
            60,
            container.clientWidth / container.clientHeight,
            0.1,
            2000
        );
        this.camera.position.set(400, 300, 400);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupRenderer() {
        const container = document.getElementById('scene-container');
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        container.appendChild(this.renderer.domElement);
    }
    
    setupControls() {
        // Use built-in OrbitControls if available
        if (THREE.OrbitControls) {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.enableZoom = true;
            this.controls.autoRotate = true;
            this.controls.autoRotateSpeed = 0.5;
            this.controls.maxDistance = 1000;
            this.controls.minDistance = 100;
        } else {
            console.warn('⚠️ OrbitControls not available - using basic mouse controls');
            this.setupBasicControls();
        }
    }
    
    setupBasicControls() {
        // Fallback basic rotation controls
        let isMouseDown = false;
        let mouseX = 0, mouseY = 0;
        
        this.renderer.domElement.addEventListener('mousedown', () => isMouseDown = true);
        this.renderer.domElement.addEventListener('mouseup', () => isMouseDown = false);
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (isMouseDown) {
                const deltaX = event.clientX - mouseX;
                const deltaY = event.clientY - mouseY;
                
                this.camera.position.x = this.camera.position.x * Math.cos(deltaX * 0.01) - this.camera.position.z * Math.sin(deltaX * 0.01);
                this.camera.position.z = this.camera.position.x * Math.sin(deltaX * 0.01) + this.camera.position.z * Math.cos(deltaX * 0.01);
                
                this.camera.lookAt(0, 0, 0);
            }
            mouseX = event.clientX;
            mouseY = event.clientY;
        });
    }
    
    setupRaycaster() {
        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Points.threshold = 10;
    }
    
    createParticleSystem() {
        console.log(`Creating ${this.config.particleCount} particles...`);
        
        // Clear existing systems
        if (this.particleSystem) {
            this.scene.remove(this.particleSystem);
            this.particleSystem.geometry.dispose();
            this.particleSystem.material.dispose();
        }
        
        if (this.connectionSystem) {
            this.scene.remove(this.connectionSystem);
            this.connectionSystem.geometry.dispose();
            this.connectionSystem.material.dispose();
        }
        
        // Create particle geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.config.particleCount * 3);
        const colors = new Float32Array(this.config.particleCount * 3);
        const sizes = new Float32Array(this.config.particleCount);
        
        this.particles = [];
        
        // Generate particles in a spherical cloud
        for (let i = 0; i < this.config.particleCount; i++) {
            const i3 = i * 3;
            
            // Spherical distribution
            const radius = 100 + Math.random() * 150;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;
            
            // Color based on position (orange to yellow gradient)
            const normalizedRadius = (radius - 100) / 150;
            const color = new THREE.Color();
            color.setHSL(0.12 + normalizedRadius * 0.05, 0.9, 0.6);
            
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            // Random size
            sizes[i] = 3 + Math.random() * 4;
            
            // Store particle data
            this.particles.push({
                originalPosition: new THREE.Vector3(x, y, z),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                ),
                captured: false,
                id: i
            });
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material
        const material = new THREE.PointsMaterial({
            size: 6,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);
        
        // Create connections
        this.createConnections();
        
        // Update UI
        this.updateStats();
        
        console.log(`✅ Created ${this.config.particleCount} particles with ${this.connections.length} connections`);
    }
    
    createConnections() {
        const positions = this.particleSystem.geometry.attributes.position.array;
        const connectionPositions = [];
        const connectionColors = [];
        this.connections = [];
        
        // Find connections between nearby particles
        for (let i = 0; i < this.config.particleCount; i++) {
            const i3 = i * 3;
            const pos1 = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
            
            for (let j = i + 1; j < this.config.particleCount; j++) {
                const j3 = j * 3;
                const pos2 = new THREE.Vector3(positions[j3], positions[j3 + 1], positions[j3 + 2]);
                
                const distance = pos1.distanceTo(pos2);
                
                if (distance < this.config.connectionDistance) {
                    // Add connection line
                    connectionPositions.push(pos1.x, pos1.y, pos1.z);
                    connectionPositions.push(pos2.x, pos2.y, pos2.z);
                    
                    // Color based on distance
                    const intensity = 1.0 - (distance / this.config.connectionDistance);
                    const color = new THREE.Color(0xffaa00).multiplyScalar(intensity * 0.3);
                    
                    connectionColors.push(color.r, color.g, color.b);
                    connectionColors.push(color.r, color.g, color.b);
                    
                    this.connections.push({ i, j, distance });
                }
            }
        }
        
        if (connectionPositions.length > 0) {
            const connectionGeometry = new THREE.BufferGeometry();
            connectionGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connectionPositions, 3));
            connectionGeometry.setAttribute('color', new THREE.Float32BufferAttribute(connectionColors, 3));
            
            const connectionMaterial = new THREE.LineBasicMaterial({
                transparent: true,
                opacity: 0.4,
                vertexColors: true,
                blending: THREE.AdditiveBlending
            });
            
            this.connectionSystem = new THREE.LineSegments(connectionGeometry, connectionMaterial);
            this.scene.add(this.connectionSystem);
        }
        
        this.updateVisualStyle();
    }
    
    updateVisualStyle() {
        if (!this.particleSystem || !this.connectionSystem) return;
        
        switch(this.config.visualStyle) {
            case 'particles':
                this.particleSystem.visible = true;
                this.connectionSystem.visible = false;
                break;
            case 'connections':
                this.particleSystem.visible = false;
                this.connectionSystem.visible = true;
                break;
            case 'both':
                this.particleSystem.visible = true;
                this.connectionSystem.visible = true;
                break;
        }
    }
    
    setupEventListeners() {
        const canvas = this.renderer.domElement;
        
        // Mouse events
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
        
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupUI() {
        // Mode buttons
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.config.interactionMode = e.target.dataset.mode;
                this.updateControlsMode();
            });
        });
        
        // Visual style buttons
        document.querySelectorAll('[data-visual]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-visual]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.config.visualStyle = e.target.dataset.visual;
                this.updateVisualStyle();
            });
        });
        
        // Sliders
        this.setupSlider('particle-count', 'particleCount', (value) => {
            this.config.particleCount = parseInt(value);
            this.createParticleSystem();
        });
        
        this.setupSlider('connection-distance', 'connectionDistance', (value) => {
            this.config.connectionDistance = parseInt(value);
            this.createConnections();
        });
        
        this.setupSlider('animation-speed', 'animationSpeed', (value) => {
            this.config.animationSpeed = parseFloat(value);
        });
    }
    
    setupSlider(sliderId, configKey, callback) {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(sliderId + '-value');
        
        if (slider && valueDisplay) {
            slider.addEventListener('input', (e) => {
                const value = e.target.value;
                valueDisplay.textContent = configKey === 'animationSpeed' ? parseFloat(value).toFixed(1) : value;
                callback(value);
            });
        }
    }
    
    updateControlsMode() {
        if (!this.controls) return;
        
        switch(this.config.interactionMode) {
            case 'orbit':
                this.controls.enabled = true;
                this.controls.autoRotate = true;
                break;
            case 'attract':
            case 'repel':
                this.controls.enabled = false;
                this.controls.autoRotate = false;
                break;
        }
    }
    
    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Update mouse world position
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const distance = this.camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
        this.mouseWorld = this.raycaster.ray.at(distance * 0.5, this.mouseWorld);
    }
    
    onMouseDown(event) {
        if (event.button === 2) { // Right click
            this.startCapture();
        }
    }
    
    onMouseUp(event) {
        if (this.isCapturing) {
            this.endCapture();
        }
    }
    
    onTouchStart(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.onMouseMove(touch);
            this.startCapture();
        }
    }
    
    onTouchMove(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.onMouseMove(touch);
        }
    }
    
    onTouchEnd(event) {
        if (this.isCapturing) {
            this.endCapture();
        }
    }
    
    startCapture() {
        this.isCapturing = true;
        document.getElementById('vault-zone').classList.add('capturing');
    }
    
    endCapture() {
        this.isCapturing = false;
        document.getElementById('vault-zone').classList.remove('capturing');
        
        // Simulate capturing nearby particles
        const positions = this.particleSystem.geometry.attributes.position.array;
        let captured = 0;
        
        for (let i = 0; i < this.config.particleCount; i++) {
            const i3 = i * 3;
            const particlePos = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
            const distance = particlePos.distanceTo(this.mouseWorld);
            
            if (distance < this.config.captureRadius && !this.particles[i].captured) {
                this.particles[i].captured = true;
                this.capturedParticles.push(i);
                captured++;
            }
        }
        
        if (captured > 0) {
            console.log(`🔒 Captured ${captured} AI nodes`);
            this.updateStats();
        }
    }
    
    onWindowResize() {
        const container = document.getElementById('scene-container');
        
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    updateParticles() {
        if (!this.particleSystem) return;
        
        const positions = this.particleSystem.geometry.attributes.position.array;
        const time = performance.now() * 0.001 * this.config.animationSpeed;
        
        for (let i = 0; i < this.config.particleCount; i++) {
            if (this.particles[i].captured) continue;
            
            const i3 = i * 3;
            const particle = this.particles[i];
            const particlePos = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
            
            // Apply interaction forces
            const distanceToMouse = particlePos.distanceTo(this.mouseWorld);
            
            if (this.config.interactionMode === 'attract' && distanceToMouse < this.config.mouseInfluence) {
                const direction = this.mouseWorld.clone().sub(particlePos).normalize();
                const force = (1.0 - distanceToMouse / this.config.mouseInfluence) * 0.5;
                particle.velocity.add(direction.multiplyScalar(force * 0.1));
            } else if (this.config.interactionMode === 'repel' && distanceToMouse < this.config.mouseInfluence) {
                const direction = particlePos.clone().sub(this.mouseWorld).normalize();
                const force = (1.0 - distanceToMouse / this.config.mouseInfluence) * 0.5;
                particle.velocity.add(direction.multiplyScalar(force * 0.1));
            }
            
            // Apply velocity
            positions[i3] += particle.velocity.x;
            positions[i3 + 1] += particle.velocity.y;
            positions[i3 + 2] += particle.velocity.z;
            
            // Apply damping
            particle.velocity.multiplyScalar(0.98);
            
            // Gentle floating motion
            positions[i3] += Math.sin(time + i * 0.1) * 0.05;
            positions[i3 + 1] += Math.cos(time * 1.1 + i * 0.1) * 0.05;
            positions[i3 + 2] += Math.sin(time * 0.7 + i * 0.1) * 0.05;
            
            // Return force to original position
            const returnForce = particle.originalPosition.clone().sub(particlePos).multiplyScalar(0.001);
            particle.velocity.add(returnForce);
        }
        
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }
    
    updateStats() {
        this.stats.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.stats.lastTime >= 1000) {
            this.stats.fps = this.stats.frameCount;
            this.stats.frameCount = 0;
            this.stats.lastTime = currentTime;
            
            // Update UI
            document.getElementById('fps-counter').textContent = this.stats.fps;
            document.getElementById('particle-counter').textContent = this.config.particleCount;
            document.getElementById('connection-counter').textContent = this.connections.length;
            document.getElementById('captured-counter').textContent = this.capturedParticles.length;
            document.getElementById('vault-count').textContent = this.capturedParticles.length;
        }
    }
    
    hideInstructions() {
        const instructions = document.getElementById('instructions');
        if (instructions) {
            instructions.style.opacity = '0';
            instructions.style.transition = 'opacity 2s ease';
        }
    }
    
    startAnimation() {
        const animate = () => {
            requestAnimationFrame(animate);
            
            this.updateParticles();
            this.updateStats();
            
            if (this.controls) {
                this.controls.update();
            }
            
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
        console.log('✅ Animation loop started');
    }
    
    destroy() {
        // Cleanup
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.particleSystem) {
            this.particleSystem.geometry.dispose();
            this.particleSystem.material.dispose();
        }
        if (this.connectionSystem) {
            this.connectionSystem.geometry.dispose();
            this.connectionSystem.material.dispose();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌌 Starting Particle System 3D...');
    
    // Check Three.js availability
    if (typeof THREE === 'undefined') {
        console.error('❌ THREE.js not loaded');
        return;
    }
    
    console.log('✅ THREE.js loaded successfully');
    
    // Create particle system
    const particleSystem = new ParticleSystem3D();
    
    // Make globally available for debugging
    window.particleSystem = particleSystem;
}); 