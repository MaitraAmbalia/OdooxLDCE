import { AppError } from '../../lib/AppError.js';

export function createProjectsService({ prisma }) {
  return {
    async createProject(ownerId, input) {
      return prisma.project.create({
        data: {
          name: input.name,
          description: input.description,
          type: input.type ?? 'OTHER',
          status: 'ACTIVE',
          eventId: input.eventId ?? null,
          ownerId,
        },
      });
    },

    async listProjects() {
      return prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
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
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
      });
    },

    async updateTaskStatus(taskId, status) {
      return prisma.task.update({
        where: { id: taskId },
        data: { status },
      });
    },

    async assignTask(taskId, userIds) {
      await prisma.taskAssignee.deleteMany({ where: { taskId } });
      if (userIds && userIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: userIds.map((userId) => ({ taskId, userId })),
        });
      }
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
  };
}
