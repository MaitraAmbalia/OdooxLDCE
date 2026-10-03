import { AppError } from '../../lib/AppError.js';
import { parsePagination, createPageMeta } from '../../lib/pagination.js';
import { notifyMany } from '../../lib/notify.js';

// Leaders who oversee every task (and its chat). Everyone else needs to be on the task.
const MANAGE = ['project.manage', 'volunteer.manage'];
const isManager = (user) => MANAGE.some((p) => user.permissions?.includes(p));
const taskNotFound = () => new AppError('NOT_FOUND', 404, 'Task not found');
const assigneeInclude = { where: { removedAt: null }, include: { user: { select: { id: true, name: true } } } };

export function createProjectsService({ prisma }) {
  // Task chat is isolated per task: only its active assignees, its creator, the project owner
  // and leaders may read or post. Others get 404 so task ids can't be probed.
  async function accessibleTask(user, taskId) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { id: true, name: true, ownerId: true } }, assignees: assigneeInclude },
    });
    if (!task) throw taskNotFound();
    const allowed = isManager(user) || task.createdById === user.id || task.project.ownerId === user.id
      || task.assignees.some((a) => a.userId === user.id);
    if (!allowed) throw taskNotFound();
    return task;
  }

  const toMessage = (m) => ({ id: m.id, body: m.body, createdAt: m.createdAt, sender: m.sender });

  return {
    async getTask(user, taskId) {
      const task = await accessibleTask(user, taskId);
      return { ...task, canManage: isManager(user) };
    },

    async listMessages(user, taskId, { after } = {}) {
      await accessibleTask(user, taskId);
      const since = after ? new Date(after) : null;
      const messages = await prisma.chatMessage.findMany({
        where: { channel: { taskId }, deletedAt: null, ...(since && !Number.isNaN(since.getTime()) ? { createdAt: { gt: since } } : {}) },
        orderBy: { createdAt: 'asc' },
        take: 200,
        include: { sender: { select: { id: true, name: true } } },
      });
      return messages.map(toMessage);
    },

    async postMessage(user, taskId, { body, clientMsgId }) {
      const task = await accessibleTask(user, taskId);
      const text = typeof body === 'string' ? body.trim() : '';
      if (!text || text.length > 2000) throw new AppError('VALIDATION_ERROR', 400, 'Message must be 1-2000 characters');
      if (typeof clientMsgId !== 'string' || !clientMsgId || clientMsgId.length > 64) {
        throw new AppError('VALIDATION_ERROR', 400, 'clientMsgId is required');
      }
      const channel = await prisma.chatChannel.upsert({ where: { taskId }, update: {}, create: { taskId } });
      if (channel.isReadOnly || task.status === 'DONE') throw new AppError('CHAT_READ_ONLY', 409, 'This task chat is closed');
      // (senderId, clientMsgId) is unique, so a retried send returns the original message.
      const message = await prisma.chatMessage.upsert({
        where: { senderId_clientMsgId: { senderId: user.id, clientMsgId } },
        update: {},
        create: { channelId: channel.id, senderId: user.id, body: text, clientMsgId },
        include: { sender: { select: { id: true, name: true } } },
      });
      return toMessage(message);
    },

    async createProject(ownerId, input) {
      return prisma.project.create({
        data: {
          name: input.name,
          description: input.description,
          type: input.type ?? 'OTHER',
          status: 'ACTIVE',
          eventId: input.eventId ?? null,
          startDate: input.startDate ? new Date(input.startDate) : new Date(),
          endDate: input.endDate ? new Date(input.endDate) : new Date(Date.now() + 60 * 24 * 3600000),
          ownerId,
        },
      });
    },

    async listProjects(query = {}) {
      const page = parsePagination(query, { defaultLimit: 50 });

      const [data, total] = await Promise.all([
        prisma.project.findMany({
          orderBy: { createdAt: 'desc' },
          skip: page.skip,
          take: page.take,
          include: {
            tasks: {
              include: {
                assignees: {
                  include: {
                    user: { select: { id: true, name: true, email: true } },
                  },
                },
              },
            },
          },
        }),
        prisma.project.count(),
      ]);

      return { data, meta: createPageMeta(page, total) };
    },

    async getProject(id) {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          tasks: {
            include: {
              assignees: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
        },
      });
      if (!project) throw new AppError('NOT_FOUND', 404, 'Project not found');
      return project;
    },

    async closeProject(id) {
      return prisma.project.update({
        where: { id },
        data: { status: 'CLOSED' },
      });
    },

    async createTask(creatorId, projectId, input) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) throw new AppError('NOT_FOUND', 404, 'Project not found');
      if (project.status === 'CLOSED') throw new AppError('PROJECT_CLOSED', 400, 'Cannot add tasks to a closed project');

      return prisma.task.create({
        data: {
          projectId,
          title: input.title,
          description: input.description ?? '',
          priority: input.priority ?? 'MEDIUM',
          status: 'TODO',
          createdById: creatorId,
          dueAt: input.dueAt || input.dueDate ? new Date(input.dueAt || input.dueDate) : new Date(Date.now() + 7 * 24 * 3600000),
        },
      });
    },

    async updateTaskStatus(user, taskId, status) {
      if (!['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'].includes(status)) {
        throw new AppError('VALIDATION_ERROR', 400, 'Invalid task status');
      }
      await accessibleTask(user, taskId);
      return prisma.task.update({
        where: { id: taskId },
        data: { status, closedAt: status === 'DONE' ? new Date() : null },
      });
    },

    async assignTask(user, taskId, userIds = []) {
      if (!isManager(user)) throw new AppError('FORBIDDEN', 403, 'Only project leads can assign tasks');
      const task = await prisma.task.findUnique({ where: { id: taskId }, include: { assignees: { where: { removedAt: null } } } });
      if (!task) throw taskNotFound();
      const before = new Set(task.assignees.map((a) => a.userId));
      await prisma.taskAssignee.deleteMany({ where: { taskId } });
      if (userIds && userIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: userIds.map((userId) => ({ taskId, userId })),
        });
      }
      await notifyMany(prisma, userIds.filter((id) => !before.has(id)), {
        type: 'TASK_ASSIGNED',
        title: 'New task assigned',
        body: `You were added to "${task.title}".`,
        link: `/volunteer/tasks/${taskId}`,
      });
      return prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignees: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
    },

    async getUserTasks(userId, query = {}) {
      const page = parsePagination(query, { defaultLimit: 20 });
      const where = {
        assignees: {
          some: {
            userId,
            removedAt: null,
          },
        },
      };

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: page.skip,
          take: page.take,
          include: {
            project: {
              select: {
                id: true,
                name: true,
                eventId: true,
                event: {
                  select: {
                    id: true,
                    title: true,
                    startAt: true,
                    endAt: true,
                    venue: true,
                  },
                },
              },
            },
          },
        }),
        prisma.task.count({ where }),
      ]);

      return { data: tasks, meta: createPageMeta(page, total) };
    },
  };
}
