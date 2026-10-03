import { Router } from 'express';

export function createProjectsRouter({ service, authenticate }) {
  const router = Router();

  router.post('/projects', authenticate, async (req, res) => {
    res.status(201).json({ data: await service.createProject(req.user.sub, req.body) });
  });

  router.get('/projects', authenticate, async (_req, res) => {
    res.json({ data: await service.listProjects() });
  });

  router.get('/projects/:id', authenticate, async (req, res) => {
    res.json({ data: await service.getProject(req.params.id) });
  });

  router.post('/projects/:id/close', authenticate, async (req, res) => {
    res.json({ data: await service.closeProject(req.params.id) });
  });

  router.post('/projects/:id/tasks', authenticate, async (req, res) => {
    res.status(201).json({ data: await service.createTask(req.user.sub, req.params.id, req.body) });
  });

  router.patch('/tasks/:id/status', authenticate, async (req, res) => {
    res.json({ data: await service.updateTaskStatus(req.params.id, req.body.status) });
  });

  router.post('/tasks/:id/assignees', authenticate, async (req, res) => {
    res.json({ data: await service.assignTask(req.params.id, req.body.userIds) });
  });

  return router;
}
