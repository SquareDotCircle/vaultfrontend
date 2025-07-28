// Smooth scroll animations for sections
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);

    // Observe all animatable elements
    const animatableElements = document.querySelectorAll('.scroll-animate');
    animatableElements.forEach(el => observer.observe(el));

    // Video/image scaling animations for demo sections
    const mediaElements = document.querySelectorAll('.demo-video, .mapping-video, .customization-video');
    
    const mediaObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.transform = 'scale(1)';
                entry.target.style.opacity = '1';
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
    });

    mediaElements.forEach(el => {
        el.style.transform = 'scale(0.9)';
        el.style.opacity = '0.7';
        el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        mediaObserver.observe(el);
    });
}

// Progress bar animations for download simulation
function animateProgressBars() {
    const progressFills = document.querySelectorAll('.progress-fill');
    
    const progressObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target;
                const progress = progressBar.getAttribute('data-progress');
                
                // Animate to the target width
                setTimeout(() => {
                    progressBar.style.width = progress + '%';
                }, 500);
            }
        });
    }, { threshold: 0.5 });

    progressFills.forEach(fill => {
        fill.style.width = '0%';
        fill.style.transition = 'width 2s cubic-bezier(0.4, 0, 0.2, 1)';
        progressObserver.observe(fill);
    });
}

// Smooth hover effects for cards
function initCardHoverEffects() {
    const cards = document.querySelectorAll('.app-card, .leader-item, .download-item');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
}

// Initialize all animations and effects
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    animateProgressBars();
    initCardHoverEffects();
    
    // Add scroll animation classes to relevant elements
    const elementsToAnimate = document.querySelectorAll(`
        .privacy-statement-section,
        .vault-demo,
        .vault-mapping,
        .vault-customization,
        .updates-section,
        .preparedness-section,
        .application-grid
    `);
    
    elementsToAnimate.forEach(el => {
        el.classList.add('scroll-animate');
    });
});

// Smooth scrolling for navigation links
document.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Add parallax effect to hero section
function initParallaxEffect() {
    const hero = document.querySelector('.hero-section');
    if (!hero) return;
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.3;
        
        hero.style.transform = `translateY(${rate}px)`;
    });
}

// Initialize parallax on load
document.addEventListener('DOMContentLoaded', initParallaxEffect); 