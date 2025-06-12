import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  testSendNotification,
} from './notification.controller';
import {authenticate } from '../../middlewares/auth.middleware'

const router = Router();

router.use(authenticate); // ✅ all routes require authentication

// GET
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);

// PATCH
router.patch('/:id/read', markNotificationAsRead);        // markNotificationRead
router.patch('/mark-all-read', markAllAsRead);            // markAllNotificationsRead

// DELETE
router.delete('/:id', deleteNotification);
router.delete('/clear/clear-all', clearAllNotifications);

// TEST WebSocket notification manually
router.post('/test', testSendNotification);               // testSendNotification

export default router;
