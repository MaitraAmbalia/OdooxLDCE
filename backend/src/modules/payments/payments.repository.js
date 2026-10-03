// DB access for payments only. `db` is either the prisma client or a transaction client.
export const paymentsRepository = {
  findById: (db, id) => db.payment.findUnique({ where: { id } }),
  findByGatewayOrderId: (db, gatewayOrderId) => db.payment.findUnique({ where: { gatewayOrderId } }),
  findByIdempotencyKey: (db, idempotencyKey) => db.payment.findUnique({ where: { idempotencyKey } }),
  create: (db, data) => db.payment.create({ data }),

  // Compare-and-set helpers: `count` tells the caller whether it won the race.
  // This is what makes webhook replays and double refunds safe.
  markPaid: (db, id, gatewayPaymentId) =>
    db.payment.updateMany({
      where: { id, gatewayPaymentId: null, status: { in: ['CREATED', 'FAILED'] } },
      data: { status: 'PAID', gatewayPaymentId, paidAt: new Date() },
    }),
  markFailed: (db, id) =>
    db.payment.updateMany({ where: { id, status: 'CREATED' }, data: { status: 'FAILED' } }),
  setStatus: (db, id, from, to) =>
    db.payment.updateMany({ where: { id, status: from }, data: { status: to } }),
};
