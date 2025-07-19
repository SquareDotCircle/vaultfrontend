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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(400).json({
      error: {
        message: error.message,
      },
    });
  }
} 