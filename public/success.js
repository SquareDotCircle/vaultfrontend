document.addEventListener('DOMContentLoaded', function() {
    initializeOrderTracking();
});

function initializeOrderTracking() {
    // Generate unique order number
    generateOrderNumber();
    
    // Set current time for order placement
    setOrderTime();
    
    // Load shipping information if available
    loadShippingInfo();
    
    // Start tracking animation
    startTrackingAnimation();
}

function generateOrderNumber() {
    const orderIdElement = document.getElementById('order-id');
    if (orderIdElement) {
        // Generate order number based on current date and random number
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 9000) + 1000; // 4-digit random number
        
        const orderNumber = `#GO-${year}${month}${day}-${random}`;
        orderIdElement.textContent = orderNumber;
        
        // Store order number for future reference
        sessionStorage.setItem('orderNumber', orderNumber);
    }
}

function setOrderTime() {
    const orderTimeElement = document.getElementById('order-time');
    if (orderTimeElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        orderTimeElement.textContent = `Today at ${timeString}`;
    }
}

function loadShippingInfo() {
    const shippingInfo = sessionStorage.getItem('shippingInfo');
    
    // Update shipping method
    const shippingMethodElement = document.getElementById('shipping-method');
    const deliveryEstimateElement = document.getElementById('delivery-estimate');
    
    if (shippingInfo) {
        const info = JSON.parse(shippingInfo);
        
        if (shippingMethodElement) {
            const method = info.shipping === 'express' ? 'Express Shipping' : 'Standard Shipping';
            shippingMethodElement.textContent = method;
        }
        
        const isExpress = info.shipping === 'express';
        const businessDays = isExpress ? 2 : 5;
        const deliveryDate = getBusinessDaysFromNow(businessDays);
        
        if (deliveryEstimateElement) {
            deliveryEstimateElement.textContent = deliveryDate;
        }
        
        // Update delivery estimate in order details
        const deliveryDateElement = document.getElementById('delivery-date');
        if (deliveryDateElement) {
            deliveryDateElement.textContent = isExpress ? 
                `${deliveryDate} (1-2 business days)` : 
                `${deliveryDate} (3-5 business days)`;
        }
    } else {
        // Default values
        if (deliveryEstimateElement) {
            const deliveryDate = getBusinessDaysFromNow(5);
            deliveryEstimateElement.textContent = deliveryDate;
        }
    }
}

function getBusinessDaysFromNow(businessDays) {
    const date = new Date();
    let addedDays = 0;
    
    while (addedDays < businessDays) {
        date.setDate(date.getDate() + 1);
        // Skip weekends (Saturday = 6, Sunday = 0)
        if (date.getDay() !== 0 && date.getDay() !== 6) {
            addedDays++;
        }
    }
    
    const options = { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
    };
    
    return date.toLocaleDateString('en-US', options);
}

function startTrackingAnimation() {
    // Animate the shipping status text
    setTimeout(() => {
        const shippingStatus = document.getElementById('shipping-status');
        if (shippingStatus) {
            let dots = 0;
            const baseText = 'Preparing for shipment';
            
            const interval = setInterval(() => {
                dots = (dots + 1) % 4;
                const dotString = '.'.repeat(dots);
                shippingStatus.textContent = baseText + dotString;
            }, 600);
            
            // Store interval for cleanup if needed
            window.trackingInterval = interval;
        }
    }, 2000);
}

// Utility function to show additional order actions
function showOrderActions() {
    // This could be expanded to show buttons like "Cancel Order", "Modify Address", etc.
    // For now, it's a placeholder for future functionality
}

// Make order information available globally
window.getOrderInfo = function() {
    return {
        orderNumber: sessionStorage.getItem('orderNumber'),
        shippingInfo: JSON.parse(sessionStorage.getItem('shippingInfo') || '{}'),
        orderDate: new Date().toISOString()
    };
};

// Clean up interval when page is unloaded
window.addEventListener('beforeunload', function() {
    if (window.trackingInterval) {
        clearInterval(window.trackingInterval);
    }
}); 