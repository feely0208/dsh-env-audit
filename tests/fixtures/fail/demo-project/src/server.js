import express from 'express';
import { config } from './config.js';
import { findOrder } from './db.js';

const app = express();

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/orders/:id', async (req, res) => {
  const order = await findOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'not found' });
  return res.json(order);
});

app.listen(config.port, () => {
  console.log(`checkout-api listening on ${config.port}`);
});
