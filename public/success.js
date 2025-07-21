document.addEventListener('DOMContentLoaded', function() {
    initializeOrderTracking();
});

async function initializeOrderTracking() {
    // Try to save order to database first
    await saveOrderToDatabase();
    
    // Generate unique order number (or use saved one)
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
        // Check if we have a saved order number from database
        let orderNumber = sessionStorage.getItem('savedOrderNumber');
        
        if (!orderNumber) {
            // Generate order number based on current date and random number
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const random = Math.floor(Math.random() * 9000) + 1000; // 4-digit random number
            
            orderNumber = `GO-${year}${month}${day}-${random}`;
            
            // Store order number for future reference
            sessionStorage.setItem('orderNumber', orderNumber);
        }
        
        // Display with # prefix for UI
        orderIdElement.textContent = `#${orderNumber}`;
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

// Save order to Supabase database
async function saveOrderToDatabase() {
    console.log('🏁 Starting saveOrderToDatabase process...');
    
    try {
        // Check if we have pending order data and OrderManager is available
        const pendingOrderData = sessionStorage.getItem('pendingOrderData');
        console.log('📂 Pending order data exists:', !!pendingOrderData);
        console.log('🔧 OrderManager available:', !!window.OrderManager);
        
        if (!pendingOrderData) {
            console.warn('⚠️ No pending order data found in sessionStorage');
            return;
        }
        
        if (!window.OrderManager) {
            console.warn('⚠️ OrderManager not available on success page');
            return;
        }

        console.log('📋 Parsing order data from sessionStorage...');
        const orderData = JSON.parse(pendingOrderData);
        console.log('📦 Original order data:', JSON.stringify(orderData, null, 2));
        
        // Get Stripe session ID from URL parameters if available
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        console.log('💳 Stripe session ID from URL:', sessionId);
        
        if (sessionId) {
            orderData.stripe_session_id = sessionId;
            orderData.status = 'paid'; // Update status to paid since we're on success page
            console.log('✅ Updated order data with Stripe session ID and paid status');
        }

        console.log('💾 Final order data to save:', JSON.stringify(orderData, null, 2));

        // Save order to database
        console.log('🚀 Calling OrderManager.saveOrder...');
        const result = await window.OrderManager.saveOrder(orderData);
        
        console.log('📊 Save result:', JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log('🎉 Order saved successfully to database!');
            console.log('📋 Saved order data:', result.data);
            
            // Store the database order ID for future reference
            sessionStorage.setItem('savedOrderId', result.data.id);
            sessionStorage.setItem('savedOrderNumber', result.data.order_number);
            
            // Clear pending order data since it's now saved
            sessionStorage.removeItem('pendingOrderData');
            console.log('🧹 Cleaned up pending order data from sessionStorage');
        } else {
            console.error('❌ Failed to save order to database:', result.error);
        }
    } catch (error) {
        console.error('💥 Exception in saveOrderToDatabase:', error);
        console.error('💥 Error stack:', error.stack);
        // Don't block the user experience even if database save fails
    }
}

// Clean up interval when page is unloaded
window.addEventListener('beforeunload', function() {
    if (window.trackingInterval) {
        clearInterval(window.trackingInterval);
    }
}); 