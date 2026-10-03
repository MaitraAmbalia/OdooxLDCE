// req/res mapping only; all rules live in payments.service.js.
export function createPaymentsController(service) {
  return {
    // Always 200 once the signature is valid so the gateway stops retrying. Genuine crashes
    // (e.g. DB down) surface as 500 via the error handler, so Razorpay retries safely (idempotent).
    webhook: async (req, res) => {
      const result = await service.handleWebhook(req.body, req.get('X-Razorpay-Signature'));
      req.log?.info({ result }, 'payment webhook processed');
      res.status(200).json({ data: { received: true } });
    },
    get: async (req, res) => res.json({ data: await service.get(req.user.id, req.params.id) }),
    confirm: async (req, res) =>
      res.json({ data: await service.confirm(req.user.id, req.params.id, req.body) }),
    mockComplete: async (req, res) =>
      res.json({ data: await service.mockComplete(req.user.id, req.params.id) }),
  };
}
