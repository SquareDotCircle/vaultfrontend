// Use a real, public test key.
const stripe = Stripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

console.log('Stripe initialized with key ending in:', 'pk_test_TYooMQauvdEDq54NiTphI7jx'.slice(-10));

let elements;
let paymentElement;
let isPaymentReady = false;

// Display shipping information first
displayShippingInfo();

// Initialize payment when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    addBackButton();
    updateSubmitButton(); // Set initial button state
    initializePayment();
});

// Add form submit handler
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector("#payment-form").addEventListener("submit", handleSubmit);
});

// Fetches a payment intent and captures the client secret
async function initializePayment() {
    try {
        // Show loading state
        showLoadingState();
        
        const shippingInfo = sessionStorage.getItem('shippingInfo');
        const shippingMethod = shippingInfo ? JSON.parse(shippingInfo).shipping : 'standard';
        
        console.log('Creating payment intent with shipping method:', shippingMethod);
        
        const response = await fetch("/api/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shippingMethod }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log('Raw API response:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError);
            throw new Error('Invalid response from server');
        }
        
        console.log('Parsed payment intent response:', data);
        
        if (!data.clientSecret) {
            throw new Error('No client secret received from server');
        }

        elements = stripe.elements({ clientSecret: data.clientSecret });
        paymentElement = elements.create("payment");
        
        // Add error handling for mounting
        paymentElement.on('ready', () => {
            console.log('Payment element is ready');
            isPaymentReady = true;
            updateSubmitButton();
        });
        
        paymentElement.on('change', (event) => {
            if (event.error) {
                console.error('Payment element error:', event.error);
                showMessage(event.error.message);
            }
        });
        
        // Mount the payment element
        try {
            await paymentElement.mount("#payment-element");
            console.log('Payment element mounted successfully');
            
            // Small delay to ensure everything is fully ready
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (mountError) {
            console.error('Error mounting payment element:', mountError);
            throw new Error(`Failed to mount payment element: ${mountError.message}`);
        }
        
        // Hide loading state
        hideLoadingState();
        
        console.log('Payment element mounted successfully');
        
    } catch (error) {
        console.error('Error initializing payment:', error);
        showError(`Failed to initialize payment: ${error.message}`);
        hideLoadingState();
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    
    if (!elements || !paymentElement || !isPaymentReady) {
        showMessage("Payment form is still loading. Please wait a moment and try again.");
        return;
    }
    
    setLoading(true);

    try {
        console.log('Starting payment confirmation...');
        console.log('Elements:', elements);
        console.log('Payment element:', paymentElement);
        
        const result = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/payment.html`,
            },
        });
        
        console.log('Payment confirmation result:', result);

        // This point will only be reached if there is an immediate error when
        // confirming the payment. Otherwise, your customer will be redirected to
        // your `return_url`. For some payment methods like iDEAL, your customer will
        // be redirected to an intermediate site first to authorize the payment, then
        // redirected to the `return_url`.
        if (result.error) {
            console.error('Payment confirmation error:', result.error);
            console.error('Error type:', result.error.type);
            console.error('Error code:', result.error.code);
            console.error('Error message:', result.error.message);
            
            if (result.error.type === "card_error" || result.error.type === "validation_error") {
                showMessage(result.error.message);
            } else {
                showMessage(`Payment error: ${result.error.message || 'An unexpected error occurred. Please try again.'}`);
            }
        } else {
            console.log('Payment confirmation successful, should redirect...');
        }
    } catch (err) {
        console.error('Unexpected error during payment confirmation:', err);
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        showMessage(`Unexpected error: ${err.message || 'Please try again.'}`);
    }

    setLoading(false);
}


// ------- UI helpers -------

function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");

  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.classList.add("hidden");
    messageContainer.textContent = "";
  }, 4000);
}

function showError(errorText) {
    const paymentElement = document.querySelector("#payment-element");
    paymentElement.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #e74c3c; border: 1px solid #e74c3c; border-radius: 4px; margin: 10px 0;">
            <p><strong>Error:</strong> ${errorText}</p>
            <button onclick="initializePayment()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                Try Again
            </button>
        </div>
    `;
}

function showLoadingState() {
    const paymentElement = document.querySelector("#payment-element");
    paymentElement.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
            <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 10px;">Loading payment form...</p>
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
    // The loading state will be replaced by the Stripe payment element
}

function updateSubmitButton() {
    const button = document.querySelector('.payment-button');
    if (button) {
        if (isPaymentReady) {
            button.disabled = false;
            button.textContent = button.textContent.replace('Loading...', 'Pay');
            console.log('Payment button enabled - ready for submission');
        } else {
            button.disabled = true;
            button.textContent = 'Loading...';
        }
    }
}

// Show a spinner on payment submission
function setLoading(isLoading) {
  const button = document.querySelector('.payment-button');
  if (isLoading) {
    button.disabled = true;
    button.textContent = 'Processing...';
  } else {
    button.disabled = false;
    button.textContent = 'Pay $299';
  }
}

// Display shipping information from sessionStorage
function displayShippingInfo() {
    const shippingInfo = sessionStorage.getItem('shippingInfo');
    if (shippingInfo) {
        const info = JSON.parse(shippingInfo);
        const shippingSummary = document.getElementById('shipping-summary');
        const shippingDetails = document.getElementById('shipping-details');
        
        // Format the shipping address
        const address = `${info.firstName} ${info.lastName}<br>
                        ${info.address}<br>
                        ${info.city}, ${info.state} ${info.zipCode}<br>
                        ${info.country}`;
        
        shippingDetails.innerHTML = address;
        shippingSummary.style.display = 'block';
        
        // Update price based on shipping option
        const basePrice = 299;
        const shippingCost = info.shipping === 'express' ? 15 : 0;
        const totalPrice = basePrice + shippingCost;
        
        // Update the displayed price
        const priceElement = document.querySelector('.product-price');
        if (priceElement) {
            priceElement.textContent = `$${totalPrice}`;
        }
        
        // Update the payment button text
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
    
    // Insert before the form
    const form = document.getElementById('payment-form');
    paymentBox.insertBefore(backButton, form);
}

// addBackButton is now called in the main DOMContentLoaded listener above

// Check the payment status on this page after redirect.
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const clientSecret = urlParams.get('payment_intent_client_secret');

    // If there's no client secret, it's a fresh page load, so do nothing.
    if (!clientSecret) {
        return;
    }

    // Retrieve the PaymentIntent
    const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

    // Handle the result of the payment
    switch (paymentIntent.status) {
        case "succeeded":
            // Hide the form and show the success message
            document.querySelector('#payment-form').style.display = 'none';
            document.querySelector('.product-info').style.display = 'none';
            document.querySelector('.payment-tagline').style.display = 'none';
            document.querySelector('.payment-title').textContent = 'Payment Successful!';
            
            const successMessage = document.createElement('p');
            successMessage.className = 'success-message';
            successMessage.textContent = 'Thank you for your purchase! A confirmation has been sent to your email.';
            
            document.querySelector('.payment-box').insertBefore(successMessage, document.querySelector('.stripe-info'));
            break;
        case "processing":
            showMessage("Your payment is processing.");
            break;
        case "requires_payment_method":
            showMessage("Your payment was not successful. Please try another payment method.");
            break;
        default:
            showMessage("Something went wrong.");
            break;
    }
}); 