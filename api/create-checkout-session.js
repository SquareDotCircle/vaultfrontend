const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shippingMethod } = req.body;
    const baseAmount = 29900; // $299.00 in cents
    const shippingCost = shippingMethod === 'express' ? 1500 : 0; // $15.00 in cents
    const totalAmount = baseAmount + shippingCost;

    // Create simple Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Go Offline - Offline Knowledge Device',
              description: '256GB storage with all of humanity\'s knowledge offline',
            },
            unit_amount: totalAmount, // Include shipping in the total price
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin || 'https://your-domain.vercel.app'}/payment.html?success=true`,
      cancel_url: `${req.headers.origin || 'https://your-domain.vercel.app'}/payment.html?canceled=true`,
    });

    res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: {
        message: error.message,
      },
    });
  }
} 