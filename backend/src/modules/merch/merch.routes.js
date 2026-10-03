import { Router } from 'express';

export function createMerchRouter({ service, authenticate }) {
  const router = Router();

  // GET /merch/products & /products - List hoodie & t-shirt products (Public)
  router.get(['/merch/products', '/products'], async (req, res) => {
    res.json(await service.listProducts(req.query));
  });

  // GET /merch/products/:id & /products/:id - Product details & sizes in stock
  router.get(['/merch/products/:id', '/products/:id'], async (req, res) => {
    res.json({ data: await service.getProduct(req.params.id) });
  });

  // POST /merch/orders & /orders - Order hoodie/t-shirt (Member/User)
  router.post(['/merch/orders', '/orders'], authenticate, async (req, res) => {
    res.status(201).json({ data: await service.createOrder(req.user.sub, req.body) });
  });

  // GET /merch/orders/me & /orders/me - My merch orders
  router.get(['/merch/orders/me', '/orders/me'], authenticate, async (req, res) => {
    res.json(await service.getUserOrders(req.user.sub, req.query));
  });

  // Staff fulfilment queue
  router.get('/orders', authenticate, async (req, res) => {
    res.json(await service.listOrders(req.query));
  });

  router.patch('/orders/:id/status', authenticate, async (req, res) => {
    res.json({ data: await service.updateOrderStatus(req.user.sub, req.params.id, req.body.status) });
  });

  return router;
}
