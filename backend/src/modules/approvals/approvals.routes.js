import { Router } from 'express';

export function createApprovalsRouter({ service, authenticate, requirePermission }) {
  const router = Router();

  // Require President or Treasurer to manage price approvals
  const requireApprovalManager = requirePermission('approvals.manage');

  router.post('/approvals', authenticate, requireApprovalManager, async (req, res) => {
    res.status(201).json({ data: await service.requestApproval(req.user.sub, req.body) });
  });

  router.get('/approvals/pending', authenticate, requireApprovalManager, async (req, res) => {
    res.json(await service.listPending(req.query.type, req.query));
  });

  router.post('/approvals/:id/decide', authenticate, requireApprovalManager, async (req, res) => {
    res.json({ data: await service.decide(req.user.sub, req.params.id, req.body) });
  });

  return router;
}
