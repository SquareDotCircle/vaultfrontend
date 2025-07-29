class NetworkDemo {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.connections = [];
        this.draggedNode = null;
        this.draggedGroup = [];
        this.capturedNodes = [];
        this.mouse = { x: 0, y: 0 };
        this.animationId = null;
        
        this.driveZone = {
            x: 0, y: 0, width: 140, height: 140
        };
        
        // Enhanced physics constants inspired by particle-love.com
        this.springStrength = 0.02;
        this.dampening = 0.95;
        this.maxConnectionDistance = 100;
        this.mouseAttraction = false;
        this.mouseRepulsion = true;
        this.mouseEffectRadius = 150;
        this.mouseForce = 0.5;
        this.friction = 0.98;
        this.showTrails = false;
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.createNodes();
        this.setupEventListeners();
        this.setupControls();
        this.animate();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    setupControls() {
        const controlBtns = document.querySelectorAll('.control-btn');
        controlBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                controlBtns.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Update settings based on mode
                const mode = e.target.dataset.mode;
                this.setInteractionMode(mode);
            });
        });
    }
    
    setInteractionMode(mode) {
        // Reset all modes
        this.mouseAttraction = false;
        this.mouseRepulsion = false;
        this.showTrails = false;
        
        switch(mode) {
            case 'repulsion':
                this.mouseRepulsion = true;
                break;
            case 'attraction':
                this.mouseAttraction = true;
                break;
            case 'trails':
                this.showTrails = true;
                this.mouseRepulsion = true; // Keep repulsion with trails
                break;
        }
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // Update drive zone position (bottom right)
        this.driveZone.x = rect.width - 160;
        this.driveZone.y = rect.height - 160;
    }
    
    createNodes() {
        const nodeCount = 150; // Even more nodes for a dense cloud!
        const canvasWidth = this.canvas.width / window.devicePixelRatio;
        const canvasHeight = this.canvas.height / window.devicePixelRatio;
        
        // Create one massive interconnected cloud
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const maxRadius = Math.min(canvasWidth, canvasHeight) * 0.4;
        
        for (let i = 0; i < nodeCount; i++) {
            // Use multiple distribution methods for organic cloud shape
            let x, y;
            
            if (Math.random() < 0.7) {
                // Main cloud distribution - roughly circular but organic
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.pow(Math.random(), 0.6) * maxRadius; // Bias toward center
                x = centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 80;
                y = centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 80;
            } else {
                // Scattered outliers for more organic feel
                x = Math.random() * canvasWidth;
                y = Math.random() * canvasHeight;
            }
            
            this.nodes.push({
                id: i,
                x: Math.max(20, Math.min(canvasWidth - 20, x)),
                y: Math.max(20, Math.min(canvasHeight - 20, y)),
                originalX: x,
                originalY: y,
                radius: 2.5 + Math.random() * 4,
                color: this.getNodeColor(i),
                connections: [],
                captured: false,
                velocity: { x: 0, y: 0 },
                force: { x: 0, y: 0 },
                isDragging: false,
                springDistance: 0
            });
        }
        
        this.createConnections();
    }
    
    getNodeColor(nodeId) {
        const colors = [
            '#ffaa00', // Primary accent
            '#ff6b6b', // Red
            '#4ecdc4', // Teal  
            '#45b7d1', // Blue
            '#96ceb4', // Green
            '#feca57', // Yellow
            '#ff9ff3', // Pink
            '#54a0ff', // Light blue
            '#a29bfe', // Purple
            '#fd79a8', // Rose
            '#e17055', // Orange
            '#00b894'  // Emerald
        ];
        
        // Create some variation but with tendencies toward certain colors
        const baseIndex = Math.floor(nodeId / 15) % colors.length;
        const variation = Math.floor(Math.random() * 3) - 1;
        const finalIndex = Math.max(0, Math.min(colors.length - 1, baseIndex + variation));
        
        return colors[finalIndex];
    }
    
    createConnections() {
        this.connections = [];
        
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const nodeA = this.nodes[i];
                const nodeB = this.nodes[j];
                const distance = this.getDistance(nodeA, nodeB);
                
                // Create one massive interconnected cloud
                // Connect nodes based on distance only, creating organic web
                if (distance < this.maxConnectionDistance) {
                    this.connections.push({
                        nodeA: i,
                        nodeB: j,
                        distance: distance,
                        restLength: distance,
                        opacity: Math.max(0.1, 1 - (distance / this.maxConnectionDistance))
                    });
                    
                    // Add connection references to nodes
                    nodeA.connections.push(j);
                    nodeB.connections.push(i);
                }
            }
        }
    }
    
    getDistance(nodeA, nodeB) {
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.onMouseLeave(e));
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
        
        // Track mouse position even when not dragging
        this.canvas.addEventListener('mousemove', (e) => {
            const pos = this.getEventPos(e);
            this.mouse.x = pos.x;
            this.mouse.y = pos.y;
        });
    }
    
    onMouseLeave(e) {
        // Reset mouse position when cursor leaves canvas
        this.mouse.x = -1;
        this.mouse.y = -1;
    }
    
    getEventPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
    
    onMouseDown(e) {
        const pos = this.getEventPos(e);
        this.startDrag(pos);
    }
    
    onTouchStart(e) {
        e.preventDefault();
        const pos = this.getEventPos(e);
        this.startDrag(pos);
    }
    
    startDrag(pos) {
        // Find the closest node to the mouse
        let closestNode = null;
        let closestDistance = Infinity;
        
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            if (node.captured) continue;
            
            const distance = Math.sqrt(
                (pos.x - node.x) ** 2 + (pos.y - node.y) ** 2
            );
            
            if (distance < node.radius + 15 && distance < closestDistance) {
                closestDistance = distance;
                closestNode = { node, index: i };
            }
        }
        
        if (closestNode) {
            this.draggedNode = closestNode.node;
            this.buildDragGroup(closestNode.index);
            this.canvas.style.cursor = 'grabbing';
        }
    }
    
    buildDragGroup(startIndex) {
        // Build a group of connected nodes that will move together
        this.draggedGroup = [];
        const visited = new Set();
        const queue = [{ index: startIndex, distance: 0 }];
        const maxDistance = 3; // How many connection hops to include
        
        while (queue.length > 0) {
            const { index, distance } = queue.shift();
            
            if (visited.has(index) || distance > maxDistance) continue;
            visited.add(index);
            
            const node = this.nodes[index];
            if (node.captured) continue;
            
            this.draggedGroup.push({
                node: node,
                index: index,
                distance: distance,
                originalOffset: { 
                    x: node.x - this.draggedNode.x, 
                    y: node.y - this.draggedNode.y 
                }
            });
            
            // Add connected nodes to queue
            if (distance < maxDistance) {
                for (const connectedIndex of node.connections) {
                    if (!visited.has(connectedIndex)) {
                        queue.push({ index: connectedIndex, distance: distance + 1 });
                    }
                }
            }
        }
        
        // Mark all nodes in group as being dragged
        this.draggedGroup.forEach(item => {
            item.node.isDragging = true;
            item.node.springDistance = item.distance;
        });
    }
    
    onMouseMove(e) {
        const pos = this.getEventPos(e);
        this.updateDrag(pos);
    }
    
    onTouchMove(e) {
        e.preventDefault();
        const pos = this.getEventPos(e);
        this.updateDrag(pos);
    }
    
    updateDrag(pos) {
        this.mouse = pos;
        
        if (this.draggedNode && this.draggedGroup.length > 0) {
            // Update main dragged node position
            this.draggedNode.x = pos.x;
            this.draggedNode.y = pos.y;
            
            // Update connected nodes with spring physics
            this.draggedGroup.forEach(item => {
                if (item.node === this.draggedNode) return;
                
                // Calculate spring force based on distance from main node
                const springFactor = 1 - (item.distance * 0.3); // Weaker for further nodes
                const targetX = this.draggedNode.x + item.originalOffset.x * springFactor;
                const targetY = this.draggedNode.y + item.originalOffset.y * springFactor;
                
                // Apply spring physics
                const dx = targetX - item.node.x;
                const dy = targetY - item.node.y;
                
                item.node.velocity.x += dx * this.springStrength * springFactor;
                item.node.velocity.y += dy * this.springStrength * springFactor;
                
                // Apply velocity
                item.node.x += item.node.velocity.x;
                item.node.y += item.node.velocity.y;
                
                // Apply dampening
                item.node.velocity.x *= this.dampening;
                item.node.velocity.y *= this.dampening;
            });
        }
    }
    
    onMouseUp(e) {
        this.endDrag();
    }
    
    onTouchEnd(e) {
        e.preventDefault();
        this.endDrag();
    }
    
    endDrag() {
        if (this.draggedNode) {
            // Check if any nodes in the group are in the drive zone
            const capturedInThisSession = [];
            
            this.draggedGroup.forEach(item => {
                if (this.isInDriveZone(item.node)) {
                    capturedInThisSession.push(item.node);
                }
            });
            
            // Capture all nodes that entered the drive zone
            capturedInThisSession.forEach(node => {
                this.captureNode(node);
            });
            
            // Reset dragging state
            this.draggedGroup.forEach(item => {
                item.node.isDragging = false;
                item.node.springDistance = 0;
            });
            
            this.draggedNode = null;
            this.draggedGroup = [];
            this.canvas.style.cursor = 'grab';
        }
    }
    
    isInDriveZone(node) {
        return node.x >= this.driveZone.x &&
               node.x <= this.driveZone.x + this.driveZone.width &&
               node.y >= this.driveZone.y &&
               node.y <= this.driveZone.y + this.driveZone.height;
    }
    
    captureNode(node) {
        if (node.captured) return;
        
        node.captured = true;
        this.capturedNodes.push(node);
        
        // Update the counter in the UI
        const counter = document.querySelector('.captured-count');
        if (counter) {
            counter.textContent = `${this.capturedNodes.length} AI nodes secured`;
        }
        
        // Add capture effect
        this.createCaptureEffect(node);
    }
    
    createCaptureEffect(node) {
        // Flash effect
        const originalColor = node.color;
        node.color = '#ffaa00';
        
        setTimeout(() => {
            if (node.captured) {
                node.color = originalColor;
            }
        }, 300);
    }
    
    animate() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    update() {
        const canvasWidth = this.canvas.width / window.devicePixelRatio;
        const canvasHeight = this.canvas.height / window.devicePixelRatio;
        
        for (let node of this.nodes) {
            if (!node.isDragging && !node.captured) {
                // Mouse interaction effects (inspired by particle systems)
                const distanceToMouse = Math.sqrt(
                    (this.mouse.x - node.x) ** 2 + (this.mouse.y - node.y) ** 2
                );
                
                if (distanceToMouse < this.mouseEffectRadius) {
                    const dx = node.x - this.mouse.x;
                    const dy = node.y - this.mouse.y;
                    const angle = Math.atan2(dy, dx);
                    const force = (this.mouseEffectRadius - distanceToMouse) / this.mouseEffectRadius;
                    
                    if (this.mouseRepulsion) {
                        // Repulsion effect (like kangstephen94/particles)
                        const repulsionForce = force * this.mouseForce;
                        node.velocity.x += Math.cos(angle) * repulsionForce;
                        node.velocity.y += Math.sin(angle) * repulsionForce;
                    } else if (this.mouseAttraction) {
                        // Attraction effect
                        const attractionForce = force * this.mouseForce * -1;
                        node.velocity.x += Math.cos(angle) * attractionForce;
                        node.velocity.y += Math.sin(angle) * attractionForce;
                    }
                }
                
                // Apply physics (inspired by AlgoMystique/ParticleSystems-Physics)
                node.x += node.velocity.x;
                node.y += node.velocity.y;
                
                // Apply friction
                node.velocity.x *= this.friction;
                node.velocity.y *= this.friction;
                
                // Subtle floating motion when no mouse interaction
                if (distanceToMouse > this.mouseEffectRadius) {
                    const time = Date.now() * 0.001;
                    node.x += Math.sin(time + node.id * 0.1) * 0.05;
                    node.y += Math.cos(time * 1.1 + node.id * 0.1) * 0.05;
                }
                
                // Keep nodes in bounds with bounce
                if (node.x <= node.radius || node.x >= canvasWidth - node.radius) {
                    node.velocity.x *= -0.8; // Bounce with energy loss
                    node.x = Math.max(node.radius, Math.min(canvasWidth - node.radius, node.x));
                }
                if (node.y <= node.radius || node.y >= canvasHeight - node.radius) {
                    node.velocity.y *= -0.8; // Bounce with energy loss
                    node.y = Math.max(node.radius, Math.min(canvasHeight - node.radius, node.y));
                }
            }
        }
    }
    
    draw() {
        const canvasWidth = this.canvas.width / window.devicePixelRatio;
        const canvasHeight = this.canvas.height / window.devicePixelRatio;
        
        if (this.showTrails) {
            // Fade previous frame for trail effect
            this.ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
            this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        } else {
            // Clear canvas with transparent background
            this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        }
        
        // Draw mouse effect radius (debug)
        this.drawMouseEffect();
        
        // Draw connections
        this.drawConnections();
        
        // Draw nodes
        this.drawNodes();
        
        // Draw drive zone highlight when dragging
        if (this.draggedNode) {
            this.drawDriveZoneHighlight();
        }
    }
    
    drawConnections() {
        this.ctx.lineWidth = 0.5;
        
        for (let connection of this.connections) {
            const nodeA = this.nodes[connection.nodeA];
            const nodeB = this.nodes[connection.nodeB];
            
            // Skip connections to captured nodes
            if (nodeA.captured || nodeB.captured) continue;
            
            // Highlight connections in drag group
            const isInDragGroup = nodeA.isDragging && nodeB.isDragging;
            const opacity = isInDragGroup ? 0.8 : 0.2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(nodeA.x, nodeA.y);
            this.ctx.lineTo(nodeB.x, nodeB.y);
            this.ctx.strokeStyle = `rgba(255, 170, 0, ${opacity * connection.opacity})`;
            this.ctx.stroke();
        }
    }
    
    drawMouseEffect() {
        // Subtle mouse effect visualization
        if (this.mouse.x > 0 && this.mouse.y > 0) {
            const gradient = this.ctx.createRadialGradient(
                this.mouse.x, this.mouse.y, 0,
                this.mouse.x, this.mouse.y, this.mouseEffectRadius
            );
            gradient.addColorStop(0, 'rgba(255, 170, 0, 0.05)');
            gradient.addColorStop(1, 'rgba(255, 170, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(this.mouse.x, this.mouse.y, this.mouseEffectRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawNodes() {
        for (let node of this.nodes) {
            if (node.captured) continue;
            
            // Calculate distance to mouse for enhanced effects
            const distanceToMouse = Math.sqrt(
                (this.mouse.x - node.x) ** 2 + (this.mouse.y - node.y) ** 2
            );
            const inMouseRange = distanceToMouse < this.mouseEffectRadius;
            
            // Enhanced glow for dragged nodes and nodes near mouse
            let glowIntensity = 0.4;
            let glowRadius = node.radius * 2;
            
            if (node.isDragging) {
                glowIntensity = 0.9;
                glowRadius = node.radius * 5;
            } else if (inMouseRange) {
                const proximity = 1 - (distanceToMouse / this.mouseEffectRadius);
                glowIntensity = 0.4 + (proximity * 0.4);
                glowRadius = node.radius * (2 + proximity * 2);
            }
            
            // Node glow with dynamic intensity
            const gradient = this.ctx.createRadialGradient(
                node.x, node.y, 0,
                node.x, node.y, glowRadius
            );
            gradient.addColorStop(0, node.color + Math.floor(glowIntensity * 255).toString(16).padStart(2, '0'));
            gradient.addColorStop(1, node.color + '00');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Node core with dynamic size
            const coreRadius = node.radius + (inMouseRange ? Math.sin(Date.now() * 0.01) * 0.5 : 0);
            this.ctx.fillStyle = node.color;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, coreRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Highlight effects
            if (node.isDragging) {
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            } else if (inMouseRange) {
                this.ctx.strokeStyle = node.color + '80';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        }
    }
    
    drawDriveZoneHighlight() {
        this.ctx.strokeStyle = '#ffaa00';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 8]);
        this.ctx.strokeRect(
            this.driveZone.x, 
            this.driveZone.y, 
            this.driveZone.width, 
            this.driveZone.height
        );
        this.ctx.setLineDash([]);
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Initialize the network demo when the page loads
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('networkCanvas');
    if (canvas) {
        window.networkDemo = new NetworkDemo('networkCanvas');
    }
}); 