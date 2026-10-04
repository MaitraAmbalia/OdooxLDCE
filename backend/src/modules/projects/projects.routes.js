import { Router } from 'express';
import { getIO } from '../../lib/socket.js';

export function createProjectsRouter({ service, authenticate, authorize }) {
  const router = Router();

  router.post('/projects', authenticate, authorize('project.manage', 'volunteer.manage'), async (req, res) => {
    res.status(201).json({ data: await service.createProject(req.user.sub, req.body) });
  });

  router.get('/projects', authenticate, authorize('project.manage', 'volunteer.manage'), async (req, res) => {
    res.json(await service.listProjects(req.query));
  });

  router.get('/projects/:id', authenticate, authorize('project.manage', 'volunteer.manage'), async (req, res) => {
    res.json({ data: await service.getProject(req.params.id) });
  });

  router.post('/projects/:id/close', authenticate, authorize('project.manage', 'volunteer.manage'), async (req, res) => {
    res.json({ data: await service.closeProject(req.params.id) });
  });

  router.post('/projects/:id/tasks', authenticate, authorize('project.manage', 'volunteer.manage'), async (req, res) => {
    res.status(201).json({ data: await service.createTask(req.user.sub, req.params.id, req.body) });
  });

  router.get('/tasks/me', authenticate, async (req, res) => {
    res.json(await service.getUserTasks(req.user.sub, req.query));
  });

  router.get('/tasks/:id', authenticate, async (req, res) => {
    res.json({ data: await service.getTask(req.user, req.params.id) });
  });

  // Task-scoped chat: only people on the task (plus leads) can read or post.
  router.get('/tasks/:id/messages', authenticate, async (req, res) => {
    res.json({ data: await service.listMessages(req.user, req.params.id, req.query) });
  });

  router.post('/tasks/:id/messages', authenticate, async (req, res) => {
    const data = await service.postMessage(req.user, req.params.id, req.body);
    const io = getIO();
    if (io) {
      io.to(`task:${req.params.id}`).emit('chat:message', data);
    }
    res.status(201).json({ data });
  });

  router.patch('/tasks/:id/status', authenticate, async (req, res) => {
    const data = await service.updateTaskStatus(req.user, req.params.id, req.body.status);
    const io = getIO();
    if (io) {
      io.to(`task:${req.params.id}`).emit('task:status_updated', data);
    }
    res.json({ data });
  });

  router.post('/tasks/:id/assignees', authenticate, async (req, res) => {
    res.json({ data: await service.assignTask(req.user, req.params.id, req.body.userIds) });
  });

  return router;
}
