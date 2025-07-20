// Initialize Stripe
const stripe = Stripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    displayShippingInfo();
    addBackButton();
    setupPaymentButton();
    handlePaymentResult();
});

// Set up the payment button to redirect to Stripe Checkout
function setupPaymentButton() {
    const paymentForm = document.getElementById('payment-form');
    const paymentButton = document.querySelector('.payment-button');
    
    if (paymentForm && paymentButton) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
        paymentButton.disabled = false;
        paymentButton.textContent = paymentButton.textContent.replace('Loading...', 'Pay');
    }
}

// Handle payment form submission
async function handlePaymentSubmit(event) {
    event.preventDefault();
    
    const paymentButton = document.querySelector('.payment-button');
    paymentButton.disabled = true;
    paymentButton.textContent = 'Creating checkout...';
    
    try {
        // Get shipping method for pricing
        const shippingInfo = sessionStorage.getItem('shippingInfo');
        const shippingMethod = shippingInfo ? JSON.parse(shippingInfo).shipping : 'standard';
        
        // Create checkout session
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ shippingMethod }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }
        
        const { sessionId } = await response.json();
        
        // Redirect to Stripe Checkout
        const { error } = await stripe.redirectToCheckout({
            sessionId: sessionId,
        });
        
        if (error) {
            console.error('Error redirecting to checkout:', error);
            showError(error.message);
            paymentButton.disabled = false;
            paymentButton.textContent = 'Pay Now';
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError('Unable to start checkout. Please try again.');
        paymentButton.disabled = false;
        paymentButton.textContent = 'Pay Now';
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
        
        // Update displayed prices
        const priceElement = document.querySelector('.product-price');
        if (priceElement) {
            priceElement.textContent = `$${totalPrice}`;
        }
        
        const paymentButton = document.querySelector('.payment-button');
        if (paymentButton) {
            paymentButton.textContent = `Pay $${totalPrice}`;
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