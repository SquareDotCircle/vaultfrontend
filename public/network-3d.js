class Network3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = null;
        this.mouse = new THREE.Vector2();
        this.mouseWorld = new THREE.Vector3();
        
        // Particle system
        this.particles = [];
        this.particleGeometry = null;
        this.particleMaterial = null;
        this.particleSystem = null;
        this.connections = [];
        this.connectionGeometry = null;
        this.connectionMaterial = null;
        this.connectionSystem = null;
        
        // Settings
        this.settings = {
            particleCount: 1000,
            connectionDistance: 50,
            animationSpeed: 1.0,
            interactionMode: 'orbit', // orbit, attract, repel
            visualStyle: 'nodes', // nodes, connections, both
            mouseInfluence: 100,
            mouseForce: 0.5
        };
        
        // State
        this.capturedParticles = [];
        this.isDragging = false;
        this.draggedParticles = [];
        this.stats = {
            fps: 0,
            frameCount: 0,
            lastTime: 0
        };
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.setupRaycaster();
        this.createParticleSystem();
        this.setupEventListeners();
        this.setupUI();
        this.animate();
        
        // Hide instructions after 5 seconds
        setTimeout(() => {
            const instructions = document.querySelector('.instructions');
            if (instructions) {
                instructions.style.opacity = '0';
                instructions.style.transition = 'opacity 2s ease';
            }
        }, 5000);
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        
        // Add subtle ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
        this.scene.add(ambientLight);
        
        // Add point light for particle illumination
        const pointLight = new THREE.PointLight(0xffaa00, 0.5, 1000);
        pointLight.position.set(100, 100, 100);
        this.scene.add(pointLight);
    }
    
    setupCamera() {
        const container = document.getElementById('three-container');
        this.camera = new THREE.PerspectiveCamera(
            75, 
            container.clientWidth / container.clientHeight, 
            0.1, 
            2000
        );
        this.camera.position.set(200, 200, 200);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupRenderer() {
        const container = document.getElementById('three-container');
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
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.5;
        this.controls.maxDistance = 1000;
        this.controls.minDistance = 50;
    }
    
    setupRaycaster() {
        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Points.threshold = 5;
    }
    
    createParticleSystem() {
        // Create particle geometry
        this.particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.settings.particleCount * 3);
        const colors = new Float32Array(this.settings.particleCount * 3);
        const sizes = new Float32Array(this.settings.particleCount);
        const velocities = new Float32Array(this.settings.particleCount * 3);
        
        // Generate particles in a sphere
        for (let i = 0; i < this.settings.particleCount; i++) {
            const i3 = i * 3;
            
            // Random position in sphere
            const radius = 150 + Math.random() * 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Random velocity
            velocities[i3] = (Math.random() - 0.5) * 0.2;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.2;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;
            
            // Color gradient based on position
            const hue = (Math.atan2(positions[i3 + 1], positions[i3]) + Math.PI) / (2 * Math.PI);
            const color = new THREE.Color().setHSL(0.1 + hue * 0.1, 0.8, 0.6);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            // Random size
            sizes[i] = 2 + Math.random() * 3;
            
            // Store particle data
            this.particles[i] = {
                originalPosition: new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]),
                velocity: new THREE.Vector3(velocities[i3], velocities[i3 + 1], velocities[i3 + 2]),
                captured: false,
                influenced: false
            };
        }
        
        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create particle material with custom shader
        this.particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                mousePos: { value: new THREE.Vector3() },
                mouseInfluence: { value: this.settings.mouseInfluence }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vIntensity;
                uniform float time;
                uniform vec3 mousePos;
                uniform float mouseInfluence;
                
                void main() {
                    vColor = color;
                    
                    vec3 pos = position;
                    
                    // Gentle floating animation
                    pos.x += sin(time * 0.5 + position.y * 0.01) * 2.0;
                    pos.y += cos(time * 0.3 + position.x * 0.01) * 2.0;
                    pos.z += sin(time * 0.7 + position.z * 0.01) * 2.0;
                    
                    // Mouse influence
                    float distanceToMouse = distance(pos, mousePos);
                    vIntensity = 1.0;
                    if (distanceToMouse < mouseInfluence) {
                        vIntensity = 1.0 + (1.0 - distanceToMouse / mouseInfluence) * 2.0;
                    }
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = size * vIntensity * (300.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vIntensity;
                
                void main() {
                    // Create circular particles
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    if (dist > 0.5) discard;
                    
                    // Soft edges
                    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                    alpha *= vIntensity * 0.8;
                    
                    // Glow effect
                    vec3 glowColor = vColor * (1.0 + vIntensity * 0.5);
                    
                    gl_FragColor = vec4(glowColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true
        });
        
        this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial);
        this.scene.add(this.particleSystem);
        
        this.createConnections();
    }
    
    createConnections() {
        const positions = this.particleGeometry.attributes.position.array;
        const connectionPositions = [];
        const connectionColors = [];
        
        // Create connections between nearby particles
        for (let i = 0; i < this.settings.particleCount; i++) {
            const i3 = i * 3;
            const pos1 = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
            
            for (let j = i + 1; j < this.settings.particleCount; j++) {
                const j3 = j * 3;
                const pos2 = new THREE.Vector3(positions[j3], positions[j3 + 1], positions[j3 + 2]);
                
                const distance = pos1.distanceTo(pos2);
                if (distance < this.settings.connectionDistance) {
                    // Add connection line
                    connectionPositions.push(pos1.x, pos1.y, pos1.z);
                    connectionPositions.push(pos2.x, pos2.y, pos2.z);
                    
                    // Color based on distance
                    const intensity = 1.0 - (distance / this.settings.connectionDistance);
                    const color = new THREE.Color(0xffaa00).multiplyScalar(intensity * 0.3);
                    
                    connectionColors.push(color.r, color.g, color.b);
                    connectionColors.push(color.r, color.g, color.b);
                    
                    this.connections.push({ i, j, distance });
                }
            }
        }
        
        this.connectionGeometry = new THREE.BufferGeometry();
        this.connectionGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connectionPositions, 3));
        this.connectionGeometry.setAttribute('color', new THREE.Float32BufferAttribute(connectionColors, 3));
        
        this.connectionMaterial = new THREE.LineBasicMaterial({
            transparent: true,
            opacity: 0.6,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });
        
        this.connectionSystem = new THREE.LineSegments(this.connectionGeometry, this.connectionMaterial);
        this.scene.add(this.connectionSystem);
        
        this.updateVisualStyle();
    }
    
    updateVisualStyle() {
        if (!this.particleSystem || !this.connectionSystem) return;
        
        switch(this.settings.visualStyle) {
            case 'nodes':
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
        const container = this.renderer.domElement;
        
        // Mouse events
        container.addEventListener('mousemove', (e) => this.onMouseMove(e));
        container.addEventListener('mousedown', (e) => this.onMouseDown(e));
        container.addEventListener('mouseup', (e) => this.onMouseUp(e));
        container.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Touch events
        container.addEventListener('touchstart', (e) => this.onTouchStart(e));
        container.addEventListener('touchmove', (e) => this.onTouchMove(e));
        container.addEventListener('touchend', (e) => this.onTouchEnd(e));
        
        // Window events
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupUI() {
        // Mode buttons
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.settings.interactionMode = e.target.dataset.mode;
                this.updateControls();
            });
        });
        
        // Style buttons
        document.querySelectorAll('[data-style]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-style]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.settings.visualStyle = e.target.dataset.style;
                this.updateVisualStyle();
            });
        });
        
        // Sliders
        const particleSlider = document.getElementById('particleSlider');
        const distanceSlider = document.getElementById('distanceSlider');
        const speedSlider = document.getElementById('speedSlider');
        
        particleSlider?.addEventListener('input', (e) => {
            this.settings.particleCount = parseInt(e.target.value);
            document.getElementById('particleCount').textContent = this.settings.particleCount;
            this.recreateParticleSystem();
        });
        
        distanceSlider?.addEventListener('input', (e) => {
            this.settings.connectionDistance = parseInt(e.target.value);
            document.getElementById('connectionDistance').textContent = this.settings.connectionDistance;
            this.updateConnections();
        });
        
        speedSlider?.addEventListener('input', (e) => {
            this.settings.animationSpeed = parseFloat(e.target.value);
            document.getElementById('animSpeed').textContent = this.settings.animationSpeed.toFixed(1);
        });
    }
    
    updateControls() {
        switch(this.settings.interactionMode) {
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
        
        if (this.particleMaterial && this.particleMaterial.uniforms) {
            this.particleMaterial.uniforms.mousePos.value.copy(this.mouseWorld);
        }
    }
    
    onMouseDown(event) {
        if (event.button === 2) { // Right click
            this.isDragging = true;
            this.startCapture();
        }
    }
    
    onMouseUp(event) {
        if (this.isDragging) {
            this.isDragging = false;
            this.endCapture();
        }
    }
    
    onTouchStart(event) {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.onMouseMove(touch);
            this.isDragging = true;
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
        if (this.isDragging) {
            this.isDragging = false;
            this.endCapture();
        }
    }
    
    startCapture() {
        // Find particles near mouse
        const positions = this.particleGeometry.attributes.position.array;
        this.draggedParticles = [];
        
        for (let i = 0; i < this.settings.particleCount; i++) {
            const i3 = i * 3;
            const particlePos = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
            const distance = particlePos.distanceTo(this.mouseWorld);
            
            if (distance < this.settings.mouseInfluence) {
                this.draggedParticles.push(i);
            }
        }
        
        // Highlight capture zone
        const captureZone = document.getElementById('captureZone');
        if (captureZone) captureZone.classList.add('active');
    }
    
    endCapture() {
        // Check if dragged particles are in capture zone
        const captureZone = document.getElementById('captureZone');
        if (captureZone) captureZone.classList.remove('active');
        
        // Simulate capture (particles would be removed from view)
        this.capturedParticles.push(...this.draggedParticles);
        this.draggedParticles = [];
        
        this.updateStats();
    }
    
    onWindowResize() {
        const container = document.getElementById('three-container');
        
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    recreateParticleSystem() {
        // Remove existing system
        this.scene.remove(this.particleSystem);
        this.scene.remove(this.connectionSystem);
        
        // Create new system
        this.createParticleSystem();
    }
    
    updateConnections() {
        this.scene.remove(this.connectionSystem);
        this.connections = [];
        this.createConnections();
    }
    
    updateParticles() {
        if (!this.particleSystem) return;
        
        const positions = this.particleGeometry.attributes.position.array;
        const time = Date.now() * 0.001 * this.settings.animationSpeed;
        
        // Update particle positions based on interaction mode
        for (let i = 0; i < this.settings.particleCount; i++) {
            const i3 = i * 3;
            const particle = this.particles[i];
            
            if (!particle || particle.captured) continue;
            
            const particlePos = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
            const distanceToMouse = particlePos.distanceTo(this.mouseWorld);
            
            // Apply interaction forces
            if (this.settings.interactionMode === 'attract' && distanceToMouse < this.settings.mouseInfluence) {
                const direction = this.mouseWorld.clone().sub(particlePos).normalize();
                const force = (1.0 - distanceToMouse / this.settings.mouseInfluence) * this.settings.mouseForce;
                particle.velocity.add(direction.multiplyScalar(force * 0.1));
            } else if (this.settings.interactionMode === 'repel' && distanceToMouse < this.settings.mouseInfluence) {
                const direction = particlePos.clone().sub(this.mouseWorld).normalize();
                const force = (1.0 - distanceToMouse / this.settings.mouseInfluence) * this.settings.mouseForce;
                particle.velocity.add(direction.multiplyScalar(force * 0.1));
            }
            
            // Apply velocity
            positions[i3] += particle.velocity.x;
            positions[i3 + 1] += particle.velocity.y;
            positions[i3 + 2] += particle.velocity.z;
            
            // Apply damping
            particle.velocity.multiplyScalar(0.98);
            
            // Gentle return to original position
            const returnForce = particle.originalPosition.clone().sub(particlePos).multiplyScalar(0.001);
            particle.velocity.add(returnForce);
        }
        
        this.particleGeometry.attributes.position.needsUpdate = true;
        
        // Update shader uniforms
        if (this.particleMaterial && this.particleMaterial.uniforms) {
            this.particleMaterial.uniforms.time.value = time;
        }
    }
    
    updateStats() {
        this.stats.frameCount++;
        const currentTime = Date.now();
        
        if (currentTime - this.stats.lastTime >= 1000) {
            this.stats.fps = this.stats.frameCount;
            this.stats.frameCount = 0;
            this.stats.lastTime = currentTime;
            
            // Update UI
            document.getElementById('fps').textContent = this.stats.fps;
            document.getElementById('particleStats').textContent = this.settings.particleCount;
            document.getElementById('connectionStats').textContent = this.connections.length;
            document.getElementById('capturedStats').textContent = this.capturedParticles.length;
            document.getElementById('capturedCount').textContent = this.capturedParticles.length;
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateParticles();
        this.updateStats();
        
        if (this.controls) {
            this.controls.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    destroy() {
        // Cleanup
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.particleGeometry) {
            this.particleGeometry.dispose();
        }
        if (this.particleMaterial) {
            this.particleMaterial.dispose();
        }
        if (this.connectionGeometry) {
            this.connectionGeometry.dispose();
        }
        if (this.connectionMaterial) {
            this.connectionMaterial.dispose();
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    const network = new Network3D();
    
    // Global access for debugging
    window.network3d = network;
}); 