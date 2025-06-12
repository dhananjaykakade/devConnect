import { Request, Response, RequestHandler, NextFunction } from "express";
import prisma from "../../helper/prisma.helper";
import ResponseHandler from "../../utils/ApiResponse";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { clients } from '../../websocket/index';

export const getNotifications: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const notifications = await prisma.notification.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: 'desc' },
    });
    ResponseHandler.success(res, 200, 'Notifications fetched', notifications);
  } catch (error) {
    ResponseHandler.handleError(error, res);
  }
};


export const getUnreadCount: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const count = await prisma.notification.count({
      where: { receiverId: userId, isRead: false },
    });
    ResponseHandler.success(res, 200, 'Unread count fetched', { count });
  } catch (error) {
    ResponseHandler.handleError(error, res);
  }
};


export const markNotificationAsRead: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const notificationId = req.params.id;

    const notification = await prisma.notification.updateMany({
      where: { id: notificationId, receiverId: userId },
      data: { isRead: true },
    });

    ResponseHandler.success(res, 200, 'Notification marked as read', notification);
  } catch (error) {
    ResponseHandler.handleError(error, res);
  }
};


export const markAllAsRead: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    await prisma.notification.updateMany({
      where: { receiverId: userId, isRead: false },
      data: { isRead: true },
    });
    ResponseHandler.success(res, 200, 'All notifications marked as read');
  } catch (error) {
    ResponseHandler.handleError(error, res);
  }
};


export const deleteNotification: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const notificationId = req.params.id;

    await prisma.notification.deleteMany({
      where: { id: notificationId, receiverId: userId },
    });

    ResponseHandler.success(res, 200, 'Notification deleted');
  } catch (error) {
    ResponseHandler.handleError(error, res);
  }
};


export const clearAllNotifications: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    await prisma.notification.deleteMany({
      where: { receiverId: userId },
    });

    ResponseHandler.success(res, 200, 'All notifications cleared');
  } catch (error) {
    ResponseHandler.handleError(error, res);
  }
};

export const testSendNotification: RequestHandler = async (req: AuthenticatedRequest, res) => {
  try {
    const receiverId = req.user?.id;

    if (!receiverId) {
        ResponseHandler.unauthorized(res, 'User not authenticated');
      return 
    }

    const payload = {
      type: 'test',
      message: '🎉 This is a test notification!',
      createdAt: new Date(),
    };
    // save to database
    await prisma.notification.create({
        data: {
            receiverId,
            senderId: "684a867d12418cab3b8bc9a3", // assuming sender is the same for test   
            type: 'LIKE',
            message: payload.message,
            isRead: false,
        },
        });


    const client = clients.get(receiverId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }

    ResponseHandler.success(res, 200, 'Test notification sent');
  } catch (error) {
    ResponseHandler.handleError(error, res);
  }
};