// Use a real, public test key.
const stripe = Stripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

let elements;

initialize();

document
  .querySelector("#payment-form")
  .addEventListener("submit", handleSubmit);

// Display shipping information if available
displayShippingInfo();

// Fetches a payment intent and captures the client secret
async function initialize() {
  const shippingInfo = sessionStorage.getItem('shippingInfo');
  const shippingMethod = shippingInfo ? JSON.parse(shippingInfo).shipping : 'standard';
  
  const response = await fetch("/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shippingMethod }),
  });
  const { clientSecret } = await response.json();

  elements = stripe.elements({ clientSecret });

  const paymentElement = elements.create("payment");
  paymentElement.mount("#payment-element");
}

async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      // Make sure to change this to your payment completion page
      return_url: `${window.location.origin}/payment.html`,
    },
  });

  // This point will only be reached if there is an immediate error when
  // confirming the payment. Otherwise, your customer will be redirected to
  // your `return_url`. For some payment methods like iDEAL, your customer will
  // be redirected to an intermediate site first to authorize the payment, then
  // redirected to the `return_url`.
  if (error.type === "card_error" || error.type === "validation_error") {
    showMessage(error.message);
  } else {
    showMessage("An unexpected error occurred.");
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

// Call this after the page loads
document.addEventListener('DOMContentLoaded', function() {
    addBackButton();
});

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