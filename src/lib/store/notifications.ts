'use client';

import type { Notification } from '@/types';
import { cache, db, generateId } from './shared';
import { notificationToSnake, mapNotificationRow } from './mappers';

export const notificationsStore = {
  getNotifications: (getCurrentUserId: () => string | null): Notification[] => {
    const userId = getCurrentUserId();
    return cache.notifications.filter(n => !n.targetEmployeeId || n.targetEmployeeId === userId);
  },

  addNotification: async (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    cache.notifications.unshift(newNotification);
    const row = notificationToSnake(newNotification);
    row.id = newNotification.id;
    const { error } = await db.from('notifications').insert(row);
    if (error) {
      console.error('[store] addNotification error:', error.message);
      cache.notifications = cache.notifications.filter(n => n.id !== newNotification.id);
      throw new Error(error.message);
    }
    return newNotification;
  },

  deleteNotification: async (id: string): Promise<void> => {
    const deleted = cache.notifications.find(n => n.id === id);
    cache.notifications = cache.notifications.filter(n => n.id !== id);
    const { error } = await db.from('notifications').delete().eq('id', id);
    if (error) {
      console.error('[store] deleteNotification error:', error.message);
      if (deleted) cache.notifications.unshift(deleted);
      throw new Error(error.message);
    }
  },

  clearReadNotifications: async (): Promise<void> => {
    const readIds = cache.notifications.filter(n => n.isRead).map(n => n.id);
    const readNotifs = cache.notifications.filter(n => n.isRead);
    cache.notifications = cache.notifications.filter(n => !n.isRead);
    if (readIds.length > 0) {
      const { error } = await db.from('notifications').delete().in('id', readIds);
      if (error) {
        console.error('[store] clearReadNotifications error:', error.message);
        cache.notifications = [...readNotifs, ...cache.notifications];
        throw new Error(error.message);
      }
    }
  },

  markAsRead: async (id: string): Promise<void> => {
    const idx = cache.notifications.findIndex((n) => n.id === id);
    if (idx !== -1) {
      cache.notifications[idx].isRead = true;
      const { error } = await db.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) {
        console.error('[store] markAsRead error:', error.message);
        cache.notifications[idx].isRead = false;
        throw new Error(error.message);
      }
    }
  },

  markAllAsRead: async (): Promise<void> => {
    const oldNotifications = cache.notifications.map(n => ({ ...n }));
    cache.notifications = cache.notifications.map((n) => ({ ...n, isRead: true }));
    const { error } = await db.from('notifications').update({ is_read: true }).neq('is_read', true);
    if (error) {
      console.error('[store] markAllAsRead error:', error.message);
      cache.notifications = oldNotifications;
      throw new Error(error.message);
    }
  },

  unreadCount: (): number => cache.notifications.filter((n) => !n.isRead).length,

  refreshNotificationsFromDB: async (): Promise<void> => {
    try {
      const { data, error } = await db.from('notifications').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        cache.notifications = data.map((r: Record<string, unknown>) => mapNotificationRow(r));
        console.log('[store] refreshNotificationsFromDB: refreshed', cache.notifications.length, 'notifications');
      } else if (error) {
        console.error('[store] refreshNotificationsFromDB error:', error.message);
      }
    } catch (err) {
      console.error('[store] refreshNotificationsFromDB exception:', err);
    }
  },
};
