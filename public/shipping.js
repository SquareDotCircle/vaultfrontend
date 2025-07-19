document.addEventListener('DOMContentLoaded', function() {
    const shippingForm = document.getElementById('shipping-form');
    
    shippingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Collect all form data
        const formData = new FormData(shippingForm);
        const shippingInfo = {
            email: formData.get('email'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            address: formData.get('address'),
            city: formData.get('city'),
            state: formData.get('state'),
            zipCode: formData.get('zipCode'),
            country: formData.get('country'),
            phone: formData.get('phone'),
            shipping: formData.get('shipping')
        };
        
        // Store shipping information in sessionStorage
        sessionStorage.setItem('shippingInfo', JSON.stringify(shippingInfo));
        
        // Redirect to payment page
        window.location.href = 'payment.html';
    });
    
    // Update total price based on shipping selection
    const shippingOptions = document.querySelectorAll('input[name="shipping"]');
    const productPrice = document.querySelector('.product-price');
    const basePrice = 299;
    
    shippingOptions.forEach(option => {
        option.addEventListener('change', function() {
            const shippingCost = this.value === 'express' ? 15 : 0;
            const totalPrice = basePrice + shippingCost;
            productPrice.textContent = `$${totalPrice}`;
        });
    });
}); 