require('dotenv').config();
const express = require('express');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.static('.'));
app.use(express.json());

app.post('/create-payment-intent', async (req, res) => {
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

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    return res.status(400).send({
      error: {
        message: error.message,
      },
    });
  }
});

const PORT = process.env.PORT || 3075;
app.listen(PORT, () => console.log(`Node server listening on port ${PORT}!`)); 