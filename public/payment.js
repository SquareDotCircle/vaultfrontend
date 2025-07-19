// Initialize Stripe with publishable key
const stripe = Stripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

let elements;
let paymentElement;

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    displayShippingInfo();
    addBackButton();
    await initializePaymentForm();
});

// Initialize the payment form following Stripe best practices
async function initializePaymentForm() {
    try {
        showLoadingState();
        
        // Get shipping info for payment calculation
        const shippingInfo = sessionStorage.getItem('shippingInfo');
        const shippingMethod = shippingInfo ? JSON.parse(shippingInfo).shipping : 'standard';
        
        console.log('Creating payment intent...');
        
        // Create payment intent on server
        const response = await fetch("/api/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shippingMethod }),
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const { clientSecret } = await response.json();
        
        if (!clientSecret) {
            throw new Error('No client secret received from server');
        }
        
        console.log('Payment intent created successfully');
        
        // Create elements instance with client secret
        elements = stripe.elements({
            clientSecret,
            appearance: {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#0570de',
                    colorBackground: '#ffffff',
                    colorText: '#30313d',
                    colorDanger: '#df1b41',
                    fontFamily: 'Orbitron, system-ui, sans-serif',
                    spacingUnit: '4px',
                    borderRadius: '8px',
                }
            }
        });
        
        // Create and mount payment element
        paymentElement = elements.create('payment', {
            layout: 'accordion'
        });
        
        // Handle element events
        paymentElement.on('ready', () => {
            console.log('Payment element ready');
            hideLoadingState();
            enablePaymentButton();
        });
        
        paymentElement.on('change', (event) => {
            if (event.error) {
                console.error('Payment element error:', event.error);
                showError(event.error.message);
            } else {
                hideError();
            }
        });
        
        // Mount the element
        await paymentElement.mount("#payment-element");
        
        // Add form submit handler
        const form = document.getElementById('payment-form');
        form.addEventListener('submit', handleSubmit);
        
    } catch (error) {
        console.error('Error initializing payment:', error);
        showError(`Failed to initialize payment: ${error.message}`);
        hideLoadingState();
    }
}

// Handle form submission following Stripe patterns
async function handleSubmit(event) {
    event.preventDefault();
    
    if (!elements) {
        showError('Payment form not ready. Please refresh the page.');
        return;
    }
    
    setLoadingButton(true);
    
    // Confirm payment with Stripe
    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: `${window.location.origin}/payment.html`,
        },
    });
    
    // Handle immediate errors
    if (error) {
        console.error('Payment error:', error);
        
        if (error.type === "card_error" || error.type === "validation_error") {
            showError(error.message);
        } else {
            showError("An unexpected error occurred. Please try again.");
        }
        
        setLoadingButton(false);
    }
    // If no error, customer will be redirected to return_url
}

// UI Helper Functions
function showLoadingState() {
    const container = document.querySelector("#payment-element");
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; padding: 40px 20px; text-align: center;">
            <div style="width: 24px; height: 24px; border: 3px solid #f3f3f3; border-top: 3px solid #0570de; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
            <p style="margin: 0; color: #666; font-family: Orbitron, sans-serif;">Loading secure payment form...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
}

function hideLoadingState() {
    // Loading state will be replaced by payment element
}

function enablePaymentButton() {
    const button = document.querySelector('.payment-button');
    if (button) {
        button.disabled = false;
        button.textContent = button.textContent.replace('Loading...', 'Pay');
    }
}

function setLoadingButton(isLoading) {
    const button = document.querySelector('.payment-button');
    if (button) {
        button.disabled = isLoading;
        button.textContent = isLoading ? 'Processing...' : 'Pay $299';
    }
}

function showError(message) {
    const messageContainer = document.querySelector("#payment-message");
    if (messageContainer) {
        messageContainer.classList.remove("hidden");
        messageContainer.textContent = message;
        messageContainer.style.color = '#df1b41';
        messageContainer.style.marginTop = '16px';
    }
}

function hideError() {
    const messageContainer = document.querySelector("#payment-message");
    if (messageContainer) {
        messageContainer.classList.add("hidden");
        messageContainer.textContent = "";
    }
}

// Display shipping information from sessionStorage
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

// Add back button functionality
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

// Handle payment status after redirect (following Stripe patterns)
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientSecret = urlParams.get('payment_intent_client_secret');

    if (!clientSecret) {
        return; // Fresh page load
    }

    // Retrieve the PaymentIntent
    const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

    // Handle the payment result
    switch (paymentIntent.status) {
        case "succeeded":
            // Hide form and show success
            document.querySelector('#payment-form').style.display = 'none';
            document.querySelector('.product-info').style.display = 'none';
            document.querySelector('.payment-tagline').style.display = 'none';
            document.querySelector('.payment-title').textContent = 'Payment Successful!';
            
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.innerHTML = `
                <p style="color: #00d924; font-size: 18px; margin: 20px 0;">
                    ✓ Thank you for your purchase!
                </p>
                <p style="color: #666; margin: 10px 0;">
                    A confirmation has been sent to your email.
                </p>
            `;
            
            const paymentBox = document.querySelector('.payment-box');
            const stripeInfo = document.querySelector('.stripe-info');
            if (paymentBox && stripeInfo) {
                paymentBox.insertBefore(successMessage, stripeInfo);
            }
            break;
            
        case "processing":
            showError("Your payment is processing. We'll update you when payment is received.");
            break;
            
        case "requires_payment_method":
            showError("Your payment was not successful. Please try another payment method.");
            break;
            
        default:
            showError("Something went wrong. Please try again.");
            break;
    }
}); 