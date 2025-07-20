// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    displayShippingInfo();
    addBackButton();
    setupPaymentButton();
    handlePaymentResult();
});

// Set up the payment button 
function setupPaymentButton() {
    const paymentForm = document.getElementById('payment-form');
    const paymentButton = document.querySelector('.payment-button');
    
    if (paymentForm && paymentButton) {
        // Set up form to POST to our checkout endpoint
        paymentForm.action = '/api/create-checkout-session';
        paymentForm.method = 'POST';
        
        // Add shipping method and discount as hidden inputs
        const shippingInfo = sessionStorage.getItem('shippingInfo');
        const info = shippingInfo ? JSON.parse(shippingInfo) : {};
        const shippingMethod = info.shipping || 'standard';
        
        // Create hidden input for shipping method
        const hiddenShippingInput = document.createElement('input');
        hiddenShippingInput.type = 'hidden';
        hiddenShippingInput.name = 'shippingMethod';
        hiddenShippingInput.value = shippingMethod;
        paymentForm.appendChild(hiddenShippingInput);
        
        // Create hidden input for discount if present
        if (info.discount) {
            const hiddenDiscountInput = document.createElement('input');
            hiddenDiscountInput.type = 'hidden';
            hiddenDiscountInput.name = 'discount';
            hiddenDiscountInput.value = JSON.stringify(info.discount);
            paymentForm.appendChild(hiddenDiscountInput);
        }
        
        paymentButton.disabled = false;
        paymentButton.textContent = paymentButton.textContent.replace('Loading...', 'Pay');
        paymentButton.type = 'submit';
    }
}

// Handle results after returning from Stripe Checkout
function handlePaymentResult() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('success') === 'true') {
        // Payment succeeded
        document.querySelector('#payment-form').style.display = 'none';
        document.querySelector('.product-info').style.display = 'none';
        document.querySelector('.payment-tagline').style.display = 'none';
        document.querySelector('.payment-title').textContent = 'Payment Successful!';
        
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <p style="color: #00d924; font-size: 18px; margin: 20px 0; text-align: center;">
                ✓ Thank you for your purchase!
            </p>
            <p style="color: #666; margin: 10px 0; text-align: center;">
                Your order has been confirmed. You'll receive an email with tracking information soon.
            </p>
        `;
        
        const paymentBox = document.querySelector('.payment-box');
        const stripeInfo = document.querySelector('.stripe-info');
        if (paymentBox && stripeInfo) {
            paymentBox.insertBefore(successMessage, stripeInfo);
        }
    } else if (urlParams.get('canceled') === 'true') {
        // Payment was cancelled
        showError('Payment was cancelled. You can try again when ready.');
    }
}

// Display shipping information
function displayShippingInfo() {
    const shippingInfo = sessionStorage.getItem('shippingInfo');
    if (shippingInfo) {
        const info = JSON.parse(shippingInfo);
        const shippingSummary = document.getElementById('shipping-summary');
        const shippingDetails = document.getElementById('shipping-details');
        
        if (shippingDetails) {
            const address = `${info.firstName} ${info.lastName}<br>
                            ${info.address}<br>
                            ${info.city}, ${info.state} ${info.zipCode}<br>
                            ${info.country}`;
            
            shippingDetails.innerHTML = address;
        }
        
        if (shippingSummary) {
            shippingSummary.style.display = 'block';
        }
        
        // Update price based on shipping option
        const basePrice = 299;
        const shippingCost = info.shipping === 'express' ? 15 : 0;
        const totalPrice = basePrice + shippingCost;
        
        // Calculate final price with discount
        let finalPrice = totalPrice;
        if (info.discount) {
            finalPrice = Math.round(299 - info.discount.amount + shippingCost);
        }
        
        // Update displayed prices
        const priceElement = document.querySelector('.product-price');
        if (priceElement) {
            priceElement.textContent = `$${finalPrice}`;
        }
        
        const paymentButton = document.querySelector('.payment-button');
        if (paymentButton) {
            paymentButton.textContent = `Pay $${finalPrice}`;
        }
        
        // Show discount info if applied
        if (info.discount) {
            showDiscountInfo(info.discount, 299, finalPrice);
        }
    }
}

// Add back button
function addBackButton() {
    const paymentBox = document.querySelector('.payment-box');
    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'cta-button secondary back-button';
    backButton.textContent = 'Back to Shipping';
    backButton.onclick = () => window.location.href = 'shipping.html';
    
    const form = document.getElementById('payment-form');
    if (paymentBox && form) {
        paymentBox.insertBefore(backButton, form);
    }
}

// Show error messages
function showError(message) {
    const messageContainer = document.querySelector("#payment-message");
    if (messageContainer) {
        messageContainer.classList.remove("hidden");
        messageContainer.textContent = message;
        messageContainer.style.color = '#df1b41';
        messageContainer.style.marginTop = '16px';
        messageContainer.style.textAlign = 'center';
        messageContainer.style.padding = '12px';
        messageContainer.style.backgroundColor = '#fef2f2';
        messageContainer.style.border = '1px solid #fecaca';
        messageContainer.style.borderRadius = '6px';
    }
}

// Show discount information on payment page
function showDiscountInfo(discount, originalPrice, finalPrice) {
    const productInfo = document.querySelector('.product-info');
    if (productInfo && !document.querySelector('.discount-info')) {
        const discountInfo = document.createElement('div');
        discountInfo.className = 'discount-info';
        discountInfo.style.cssText = `
            background: rgba(0, 217, 36, 0.1);
            border: 1px solid rgba(0, 217, 36, 0.3);
            border-radius: 6px;
            padding: 12px;
            margin-top: 16px;
            color: #00d924;
            text-align: center;
            font-family: 'Exo', sans-serif;
            font-size: 0.9rem;
        `;
        
        discountInfo.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">🎉 ${discount.code} Applied!</div>
            <div style="color: #ccc; font-size: 0.8rem;">
                Original: <span style="text-decoration: line-through;">$${originalPrice}</span> → 
                You pay: <span style="color: #00d924; font-weight: 600;">$${finalPrice}</span>
            </div>
        `;
        
        productInfo.parentNode.insertBefore(discountInfo, productInfo.nextSibling);
    }
} 