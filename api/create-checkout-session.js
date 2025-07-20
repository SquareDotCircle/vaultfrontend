const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Handle both JSON and form data
    const shippingMethod = req.body.shippingMethod || 'standard';
    const discount = req.body.discount ? JSON.parse(req.body.discount) : null;
    
    const baseAmount = 29900; // $299.00 in cents
    const shippingCost = shippingMethod === 'express' ? 1500 : 0; // $15.00 in cents
    
    // Apply discount if present
    let discountAmount = 0;
    if (discount) {
      discountAmount = Math.round(discount.amount * 100); // Convert to cents
    }
    
    const totalAmount = Math.max(100, baseAmount - discountAmount + shippingCost); // Minimum $1.00

    const session = await stripe.checkout.sessions.create({
              line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Go Offline - Offline Knowledge Device',
                description: discount ? 
                  `256GB storage with all of humanity's knowledge offline (${discount.code} applied)` :
                  '256GB storage with all of humanity\'s knowledge offline',
              },
              unit_amount: totalAmount,
            },
            quantity: 1,
          },
        ],
      mode: 'payment',
      success_url: `${req.headers.origin || 'https://databack.ai'}/success.html`,
      cancel_url: `${req.headers.origin || 'https://databack.ai'}/cancel.html`,
      automatic_tax: { enabled: false },
    });

    // Redirect directly to Stripe Checkout
    res.redirect(303, session.url);
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: {
        message: error.message,
      },
    });
  }
} 