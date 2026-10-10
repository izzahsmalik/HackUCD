require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const PORT = 3000;
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const PAGE = '/marginguard-dashboard.html';

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.get('/', (req, res) => res.redirect(PAGE));

// Demo: one workspace, kept in memory (resets when the server restarts).
const workspace = { plan: 'free', customerId: null, subscriptionId: null };

// 1. Create a Stripe Checkout Session and send back its URL.
app.post('/billing/checkout', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      client_reference_id: 'demo-workspace',
      success_url: `${APP_URL}${PAGE}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}${PAGE}?checkout=cancelled`,
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error('checkout failed:', e.message);
    res.status(500).json({ error: 'checkout_failed' });
  }
});

// 2. After the redirect, ask Stripe whether the first invoice was really paid.
//    Only Stripe's answer unlocks Pro, never the redirect itself.
app.post('/billing/confirm', async (req, res) => {
  try {
    const s = await stripe.checkout.sessions.retrieve(req.body.sessionId, {
      expand: ['subscription.latest_invoice'],
    });
    const invoice = s.subscription && s.subscription.latest_invoice;
    const paid =
      s.client_reference_id === 'demo-workspace' &&
      s.status === 'complete' &&
      s.payment_status === 'paid' &&
      invoice && invoice.status === 'paid';
    if (paid) {
      workspace.plan = 'pro';
      workspace.customerId = s.customer;
      workspace.subscriptionId = s.subscription.id;
      console.log('Pro unlocked. Subscription:', workspace.subscriptionId);
    }
    res.json({ plan: workspace.plan });
  } catch (e) {
    console.error('confirm failed:', e.message);
    res.status(400).json({ error: 'cannot_verify' });
  }
});

// 3. The page asks this on load to show Free or Pro.
app.get('/billing/status', (req, res) => res.json({ plan: workspace.plan }));

app.listen(PORT, () => console.log(`Open http://localhost:${PORT}`));
