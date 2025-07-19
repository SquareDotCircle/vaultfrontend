document.addEventListener('DOMContentLoaded', function() {
    
    // Add subtle cursor glow effect
    const cursor = document.createElement('div');
    cursor.className = 'cursor-glow';
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });
    
    // Add cursor glow styles
    const glowStyles = document.createElement('style');
    glowStyles.textContent = `
        .cursor-glow {
            position: fixed;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, rgba(0, 255, 148, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
            transition: opacity 0.3s ease;
        }
        
        @media (hover: none) {
            .cursor-glow {
                display: none;
            }
        }
    `;
    document.head.appendChild(glowStyles);
    
    // Hide cursor glow on touch devices
    document.addEventListener('touchstart', () => {
        cursor.style.opacity = '0';
    });
    
    document.addEventListener('touchend', () => {
        cursor.style.opacity = '1';
    });

    // Scroll-triggered video zoom animation
    const vaultDemo = document.getElementById('vault-demo');
    const demoVideo = document.querySelector('.demo-video');
    
    if (vaultDemo && demoVideo) {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -20% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    demoVideo.classList.add('scrolled');
                } else {
                    demoVideo.classList.remove('scrolled');
                }
            });
        }, observerOptions);

        observer.observe(vaultDemo);
    }

    // Scroll-triggered mapping video animation
    const vaultMapping = document.getElementById('vault-mapping');
    const mappingVideo = document.querySelector('.mapping-video');
    
    if (vaultMapping && mappingVideo) {
        const mappingObserverOptions = {
            root: null,
            rootMargin: '-20% 0px -20% 0px',
            threshold: 0
        };

        const mappingObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    mappingVideo.classList.add('scrolled');
                } else {
                    mappingVideo.classList.remove('scrolled');
                }
            });
        }, mappingObserverOptions);

        mappingObserver.observe(vaultMapping);
    }

    // Scroll-triggered customization video animation
    const vaultCustomization = document.getElementById('vault-customization');
    const customizationVideo = document.querySelector('.customization-video');
    
    if (vaultCustomization && customizationVideo) {
        const customizationObserverOptions = {
            root: null,
            rootMargin: '-20% 0px -20% 0px',
            threshold: 0
        };

        const customizationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    customizationVideo.classList.add('scrolled');
                } else {
                    customizationVideo.classList.remove('scrolled');
                }
            });
        }, customizationObserverOptions);

        customizationObserver.observe(vaultCustomization);
    }
    
}); 