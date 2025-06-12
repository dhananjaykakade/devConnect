import { clients } from "../websocket/index";
import prisma from '../helper/prisma.helper'

export const sendNotification = async ({
  receiverId,
  senderId,
  type,
  message,
  link,
}: {
  receiverId: string;
  senderId?: string;
  type: "FOLLOW" | "LIKE" | "COMMENT" | "SYSTEM" | "TEST";
  message: string;
  link?: string;
}) => {
  const notification = await prisma.notification.create({
    data: {
      receiverId,
      senderId,
      type,
      message,
      link,
    },
  });

  const client = clients.get(receiverId);
  if (client && client.readyState === client.OPEN) {
    client.send(JSON.stringify(notification));
  }

  return notification;
};