// In-app notifications. Pass `tx` to commit the notification with the change that caused it.
export function notify(db, { userId, type = 'GENERAL', title, body, link = null }) {
  return db.notification.create({ data: { userId, type, title, body, link } });
}

export function notifyMany(db, userIds, { type = 'GENERAL', title, body, link = null }) {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (!ids.length) return Promise.resolve({ count: 0 });
  return db.notification.createMany({ data: ids.map((userId) => ({ userId, type, title, body, link })) });
}
