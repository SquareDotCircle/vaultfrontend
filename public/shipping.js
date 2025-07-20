document.addEventListener('DOMContentLoaded', function() {
    const shippingForm = document.getElementById('shipping-form');
    
    // Initialize address autocomplete
    initializeAddressAutocomplete();
    
    // Initialize referral code system
    initializeReferralCodes();
    
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
            shipping: formData.get('shipping'),
            referralCode: formData.get('referralCode'),
            discount: getCurrentDiscount()
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

// Address Autocomplete Functionality
function initializeAddressAutocomplete() {
    const addressInput = document.getElementById('address');
    const suggestionsContainer = document.getElementById('address-suggestions');
    let currentSuggestions = [];
    let selectedIndex = -1;
    let searchTimeout;

    if (!addressInput || !suggestionsContainer) return;

    // Handle input changes
    addressInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query.length < 3) {
            hideSuggestions();
            return;
        }

        // Debounce the search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchAddresses(query);
        }, 300);
    });

    // Handle keyboard navigation
    addressInput.addEventListener('keydown', function(e) {
        if (!suggestionsContainer.style.display || suggestionsContainer.style.display === 'none') return;

        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, currentSuggestions.length - 1);
                updateSelection();
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelection();
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    selectAddress(currentSuggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                hideSuggestions();
                break;
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!addressInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            hideSuggestions();
        }
    });

    async function searchAddresses(query) {
        try {
            showLoading();
            
            // Use Nominatim API (free OpenStreetMap geocoding service)
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error('Geocoding service unavailable');
            }
            
            const results = await response.json();
            currentSuggestions = results;
            displaySuggestions(results);
            
        } catch (error) {
            console.error('Address search error:', error);
            showError('Address search temporarily unavailable');
        }
    }

    function displaySuggestions(results) {
        if (results.length === 0) {
            showError('No addresses found');
            return;
        }

        const suggestions = results.map((result, index) => {
            const address = formatAddress(result);
            return `<div class="address-suggestion" data-index="${index}">${address}</div>`;
        }).join('');

        suggestionsContainer.innerHTML = suggestions;
        suggestionsContainer.style.display = 'block';
        selectedIndex = -1;

        // Add click handlers
        suggestionsContainer.querySelectorAll('.address-suggestion').forEach((suggestion, index) => {
            suggestion.addEventListener('click', () => {
                selectAddress(results[index]);
            });
        });
    }

    function formatAddress(result) {
        const parts = [];
        
        if (result.display_name) {
            // Use the display name but make it cleaner
            const displayName = result.display_name;
            return displayName;
        }
        
        return 'Unknown address';
    }

    function selectAddress(result) {
        const address = result.address || {};
        
        // Fill in the address fields
        addressInput.value = getStreetAddress(result);
        
        // Auto-fill other fields if available
        if (address.city || address.town || address.village) {
            document.getElementById('city').value = address.city || address.town || address.village;
        }
        
        if (address.state || address.region) {
            document.getElementById('state').value = address.state || address.region;
        }
        
        if (address.postcode) {
            document.getElementById('zipCode').value = address.postcode;
        }
        
        if (address.country_code) {
            const countrySelect = document.getElementById('country');
            const countryCode = address.country_code.toUpperCase();
            
            // Try to match country code with select options
            const option = Array.from(countrySelect.options).find(opt => opt.value === countryCode);
            if (option) {
                countrySelect.value = countryCode;
            }
        }

        hideSuggestions();
        
        // Focus on next empty field
        const nextField = document.getElementById('city');
        if (nextField && !nextField.value) {
            nextField.focus();
        }
    }

    function getStreetAddress(result) {
        const address = result.address || {};
        const parts = [];
        
        if (address.house_number) parts.push(address.house_number);
        if (address.road) parts.push(address.road);
        
        return parts.join(' ') || result.display_name?.split(',')[0] || '';
    }

    function updateSelection() {
        const suggestions = suggestionsContainer.querySelectorAll('.address-suggestion');
        suggestions.forEach((suggestion, index) => {
            suggestion.classList.toggle('selected', index === selectedIndex);
        });
    }

    function showLoading() {
        suggestionsContainer.innerHTML = '<div class="address-loading">Searching addresses...</div>';
        suggestionsContainer.style.display = 'block';
    }

    function showError(message) {
        suggestionsContainer.innerHTML = `<div class="address-loading">${message}</div>`;
        suggestionsContainer.style.display = 'block';
        setTimeout(hideSuggestions, 3000);
    }

    function hideSuggestions() {
        suggestionsContainer.style.display = 'none';
        suggestionsContainer.innerHTML = '';
        currentSuggestions = [];
        selectedIndex = -1;
    }
}

// Referral Code System
function initializeReferralCodes() {
    const referralInput = document.getElementById('referralCode');
    const referralMessage = document.getElementById('referral-message');
    const productPrice = document.querySelector('.product-price');
    const discountSummary = document.getElementById('discount-summary');
    
    // Referral codes configuration
    const referralCodes = {
        'GOOFFLINE40': {
            discount: 0.40, // 40% discount
            description: '40% off your order!'
        },
        'SPECIAL35': {
            discount: 264, // Fixed discount to bring price to $35
            description: 'Special price: $35!'
        }
    };
    
    let currentDiscount = null;
    
    if (!referralInput) return;
    
    // Check referral code on input change
    referralInput.addEventListener('input', function() {
        const code = this.value.trim().toUpperCase();
        
        if (code === '') {
            resetDiscount();
            return;
        }
        
        if (referralCodes[code]) {
            applyDiscount(code, referralCodes[code]);
        } else if (code.length >= 3) {
            showReferralMessage('Invalid referral code', 'error');
            resetDiscount();
        }
    });
    
    function applyDiscount(code, discountConfig) {
        const basePrice = 299;
        const shippingCost = getShippingCost();
        let discountAmount, finalPrice;
        
        if (typeof discountConfig.discount === 'number' && discountConfig.discount < 1) {
            // Percentage discount
            discountAmount = basePrice * discountConfig.discount;
            finalPrice = basePrice - discountAmount + shippingCost;
        } else {
            // Fixed amount discount
            discountAmount = discountConfig.discount;
            finalPrice = basePrice - discountAmount + shippingCost;
        }
        
        currentDiscount = {
            code: code,
            amount: discountAmount,
            finalPrice: finalPrice,
            type: typeof discountConfig.discount === 'number' && discountConfig.discount < 1 ? 'percentage' : 'fixed'
        };
        
        // Update UI
        showReferralMessage(discountConfig.description, 'success');
        updatePriceDisplay(finalPrice);
        showDiscountSummary(basePrice, discountAmount, finalPrice, shippingCost);
    }
    
    function resetDiscount() {
        currentDiscount = null;
        hideReferralMessage();
        hideDiscountSummary();
        updatePriceDisplay(299 + getShippingCost());
    }
    
    function showReferralMessage(message, type) {
        referralMessage.textContent = message;
        referralMessage.className = `referral-message ${type}`;
    }
    
    function hideReferralMessage() {
        referralMessage.className = 'referral-message';
    }
    
    function updatePriceDisplay(price) {
        if (productPrice) {
            productPrice.textContent = `$${Math.round(price)}`;
        }
    }
    
    function showDiscountSummary(originalPrice, discountAmount, finalPrice, shippingCost) {
        if (discountSummary) {
            document.getElementById('discount-amount').textContent = `-$${Math.round(discountAmount)}`;
            document.getElementById('final-price').textContent = `$${Math.round(finalPrice)}`;
            
            // Show shipping cost if applicable
            if (shippingCost > 0) {
                const breakdown = document.querySelector('.price-breakdown');
                if (!breakdown.querySelector('.shipping-cost')) {
                    const shippingDiv = document.createElement('div');
                    shippingDiv.className = 'shipping-cost';
                    shippingDiv.innerHTML = `Shipping: <span style="color: #ccc;">+$${shippingCost}</span>`;
                    breakdown.appendChild(shippingDiv);
                }
            }
            
            discountSummary.classList.add('active');
        }
    }
    
    function hideDiscountSummary() {
        if (discountSummary) {
            discountSummary.classList.remove('active');
            // Remove shipping cost display
            const shippingCost = discountSummary.querySelector('.shipping-cost');
            if (shippingCost) {
                shippingCost.remove();
            }
        }
    }
    
    function getShippingCost() {
        const expressShipping = document.querySelector('input[name="shipping"][value="express"]');
        return (expressShipping && expressShipping.checked) ? 15 : 0;
    }
    
    // Update discount when shipping changes
    const shippingOptions = document.querySelectorAll('input[name="shipping"]');
    shippingOptions.forEach(option => {
        option.addEventListener('change', function() {
            if (currentDiscount) {
                // Reapply discount with new shipping cost
                const basePrice = 299;
                const shippingCost = getShippingCost();
                const finalPrice = currentDiscount.finalPrice - (currentDiscount.finalPrice - basePrice + currentDiscount.amount) + shippingCost;
                updatePriceDisplay(finalPrice);
                showDiscountSummary(basePrice, currentDiscount.amount, finalPrice, shippingCost);
            }
        });
    });
    
    // Make current discount available globally
    window.getCurrentDiscount = function() {
        return currentDiscount;
    };
}