class NetworkDemo {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.connections = [];
        this.draggedNode = null;
        this.capturedNodes = [];
        this.mouse = { x: 0, y: 0 };
        this.animationId = null;
        
        this.driveZone = {
            x: 0, y: 0, width: 120, height: 120
        };
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.createNodes();
        this.setupEventListeners();
        this.animate();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Update drive zone position (bottom right)
        this.driveZone.x = this.canvas.width - 140;
        this.driveZone.y = this.canvas.height - 140;
    }
    
    createNodes() {
        const nodeCount = 25;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        for (let i = 0; i < nodeCount; i++) {
            // Create nodes in a more distributed pattern
            const angle = (i / nodeCount) * Math.PI * 2;
            const radius = 50 + Math.random() * 150;
            const x = centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 100;
            const y = centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 100;
            
            this.nodes.push({
                id: i,
                x: Math.max(20, Math.min(this.canvas.width - 20, x)),
                y: Math.max(20, Math.min(this.canvas.height - 20, y)),
                radius: 4 + Math.random() * 6,
                color: this.getNodeColor(),
                connections: [],
                captured: false,
                velocity: { x: 0, y: 0 }
            });
        }
        
        this.createConnections();
    }
    
    getNodeColor() {
        const colors = [
            '#ffaa00', // Primary accent
            '#ff6b6b', // Red
            '#4ecdc4', // Teal  
            '#45b7d1', // Blue
            '#96ceb4', // Green
            '#feca57', // Yellow
            '#ff9ff3', // Pink
            '#54a0ff'  // Light blue
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    createConnections() {
        this.connections = [];
        const maxDistance = 100;
        
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const nodeA = this.nodes[i];
                const nodeB = this.nodes[j];
                const distance = this.getDistance(nodeA, nodeB);
                
                if (distance < maxDistance) {
                    this.connections.push({
                        nodeA: i,
                        nodeB: j,
                        distance: distance,
                        opacity: 1 - (distance / maxDistance)
                    });
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
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
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
        
        for (let node of this.nodes) {
            if (node.captured) continue;
            
            const distance = Math.sqrt(
                (pos.x - node.x) ** 2 + (pos.y - node.y) ** 2
            );
            
            if (distance < node.radius + 10 && distance < closestDistance) {
                closestDistance = distance;
                closestNode = node;
            }
        }
        
        if (closestNode) {
            this.draggedNode = closestNode;
            this.canvas.style.cursor = 'grabbing';
        }
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
        
        if (this.draggedNode) {
            this.draggedNode.x = pos.x;
            this.draggedNode.y = pos.y;
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
            // Check if node is in the drive zone
            if (this.isInDriveZone(this.draggedNode)) {
                this.captureNode(this.draggedNode);
            }
            
            this.draggedNode = null;
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
        node.captured = true;
        this.capturedNodes.push(node);
        
        // Update the counter in the UI
        const counter = document.querySelector('.captured-count');
        if (counter) {
            counter.textContent = `${this.capturedNodes.length} nodes secured`;
        }
        
        // Add some visual feedback
        this.createCaptureEffect(node);
    }
    
    createCaptureEffect(node) {
        // Simple flash effect
        const originalColor = node.color;
        node.color = '#ffaa00';
        
        setTimeout(() => {
            if (node.captured) {
                node.color = originalColor;
            }
        }, 200);
    }
    
    animate() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    update() {
        // Update connections based on current node positions
        this.createConnections();
        
        // Add subtle movement to non-dragged, non-captured nodes
        for (let node of this.nodes) {
            if (node !== this.draggedNode && !node.captured) {
                // Very subtle floating motion
                node.x += Math.sin(Date.now() * 0.001 + node.id) * 0.1;
                node.y += Math.cos(Date.now() * 0.0015 + node.id) * 0.1;
                
                // Keep nodes in bounds
                node.x = Math.max(node.radius, Math.min(this.canvas.width - node.radius, node.x));
                node.y = Math.max(node.radius, Math.min(this.canvas.height - node.radius, node.y));
            }
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
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
        for (let connection of this.connections) {
            const nodeA = this.nodes[connection.nodeA];
            const nodeB = this.nodes[connection.nodeB];
            
            // Skip connections to captured nodes
            if (nodeA.captured || nodeB.captured) continue;
            
            this.ctx.beginPath();
            this.ctx.moveTo(nodeA.x, nodeA.y);
            this.ctx.lineTo(nodeB.x, nodeB.y);
            this.ctx.strokeStyle = `rgba(255, 170, 0, ${connection.opacity * 0.3})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }
    
    drawNodes() {
        for (let node of this.nodes) {
            if (node.captured) continue;
            
            // Node glow
            const gradient = this.ctx.createRadialGradient(
                node.x, node.y, 0,
                node.x, node.y, node.radius * 3
            );
            gradient.addColorStop(0, node.color + '80');
            gradient.addColorStop(1, node.color + '00');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Node core
            this.ctx.fillStyle = node.color;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Highlight if being dragged
            if (node === this.draggedNode) {
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        }
    }
    
    drawDriveZoneHighlight() {
        this.ctx.strokeStyle = '#ffaa00';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
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