import { Router } from 'express';

export function createMerchRouter({ service, authenticate }) {
  const router = Router();

  // GET /merch/products - List hoodie & t-shirt products (Public)
  router.get('/merch/products', async (_req, res) => {
    res.json({ data: await service.listProducts() });
  });

  // GET /merch/products/:id - Product details & sizes in stock
  router.get('/merch/products/:id', async (req, res) => {
    res.json({ data: await service.getProduct(req.params.id) });
  });

  // POST /merch/orders - Order hoodie/t-shirt (Member/User)
  router.post('/merch/orders', authenticate, async (req, res) => {
    res.status(201).json({ data: await service.createOrder(req.user.sub, req.body) });
  });

  // GET /merch/orders/me - My merch orders
  router.get('/merch/orders/me', authenticate, async (req, res) => {
    res.json({ data: await service.getUserOrders(req.user.sub) });
  });

  return router;
}
