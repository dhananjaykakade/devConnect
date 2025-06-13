import request from 'supertest';
import WebSocket from 'ws';
import http from 'http';
import app from '../app';
import { setupWebSocket } from '../websocket';
import prisma from '../helper/prisma.helper';

let server: http.Server;
let wsUrl: string;
let token: string;
let userId: string;

beforeAll(async () => {
  server = http.createServer(app);
  setupWebSocket(server);

  await new Promise<void>((resolve) => {
    server.listen(() => {
      const address = server.address();
      const port = typeof address === 'object' && address?.port;
      wsUrl = `ws://localhost:${port}/?userId=test-user`;
      resolve();
    });
  });

  const res = await request(app).post('/api/auth/register').send({
    username: 'notifyuser',
    email: 'notify@example.com',
    password: 'Test@1234',
    name: 'Notify User',
  });
  // set userId for later use
  userId = res.body.data.user.id;
    const setCookies = res.headers['set-cookie'];
    expect(setCookies).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^accessToken=.*HttpOnly/),
        expect.stringMatching(/^refreshToken=.*HttpOnly/),
      ])
    );

    const cookiesArray = Array.isArray(setCookies) ? setCookies : [setCookies];
    token = cookiesArray.find((c) => c.startsWith('accessToken='));
    console.log('Auth Token:', token);
    token = token ? token.split(';')[0].split('=')[1] : '';
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
  await prisma.notification.deleteMany();
    await prisma.refreshToken.deleteMany({})
  await prisma.user.deleteMany();
});

describe('📢 WebSocket - Notification Channel', () => {
  it('should connect to WebSocket server with userId', (done) => {
    const client = new WebSocket(wsUrl);

    client.on('open', () => {
      expect(client.readyState).toBe(WebSocket.OPEN);
      client.close();
      done();
    });

    client.on('error', (err) => {
      done(err);
    });
  });
});

describe('🔔 Notification REST APIs', () => {
  let notificationId: string;

  it('should send a test notification', async () => {
    const res = await request(app)
      .post('/api/notifications/test')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Test notification sent');

    const notifications = await prisma.notification.findMany({ where: { receiverId: userId } });
    expect(notifications.length).toBeGreaterThan(0);
    notificationId = notifications[0].id;
  });

  it('should fetch all notifications', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should fetch unread notification count', async () => {
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(typeof res.body.data.count).toBe('number');
  });

  it('should mark a notification as read', async () => {
    const res = await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });

  it('should mark all notifications as read', async () => {
    const res = await request(app)
      .patch('/api/notifications/mark-all-read')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });

  it('should delete a notification', async () => {
    const res = await request(app)
      .delete(`/api/notifications/${notificationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });

  it('should clear all notifications', async () => {
    const res = await request(app)
      .delete('/api/notifications/clear/clear-all')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
});

it('should receive real-time notification over WebSocket', (done) => {
  const client = new WebSocket(`ws://localhost:${(server.address() as any).port}/?userId=${userId}`);

  client.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    expect(msg.message).toBe('🎉 This is a test notification!');
    client.close();
    done();
  });

  client.on('open', async () => {
    await request(app)
      .post('/api/notifications/test')
      .set('Authorization', `Bearer ${token}`);
  });
});