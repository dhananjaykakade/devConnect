import request from 'supertest';
import app from '../app';
import prisma from '../helper/prisma.helper';


let userToken: string;
let userId: string;
let otherUserId: string;


const testUser = {
  email: 'user@example.com',
  password: 'pass123',
  username: 'user1',
  name: 'User One',
};

const testOtherUser = {
  email: 'other@example.com',
  password: 'pass456',
  username: 'user2',
  name: 'User Two',
};


beforeAll(async () => {
  // Register users
  await request(app).post('/api/auth/register').send(testUser);
  await request(app).post('/api/auth/register').send(testOtherUser);

  // Login to get token
  const res = await request(app).post('/api/auth/login').send({
    email: testUser.email,
    password: testUser.password,
  });
  userId = res.body.data.user.id;
    const setCookies = res.headers['set-cookie'];
    expect(setCookies).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^accessToken=.*HttpOnly/),
        expect.stringMatching(/^refreshToken=.*HttpOnly/),
      ])
    );

    const cookiesArray = Array.isArray(setCookies) ? setCookies : [setCookies];
    userToken = cookiesArray.find((c) => c.startsWith('accessToken='));
    console.log('Auth Token:', userToken);
    userToken = userToken ? userToken.split(';')[0].split('=')[1] : '';

  const user = await prisma.user.findUnique({ where: { email: testUser.email } });
  const otherUser = await prisma.user.findUnique({ where: { email: testOtherUser.email } });

  userId = user?.id!;
  otherUserId = otherUser?.id!;
});
afterAll(async () => {
  // Cleanup test users
  await prisma.refreshToken.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});



describe('User Routes', () => {

    it('should search users by query', async () => {
  const res = await request(app).get('/api/users/search?q=user1');
  expect(res.statusCode).toBe(200);
  expect(res.body.data.length).toBeGreaterThan(0);
});

it('should follow another user', async () => {
  const res = await request(app)
    .post(`/api/users/${otherUserId}/follow`)
    .set('Authorization', `Bearer ${userToken}`);

  expect(res.statusCode).toBe(200);
});

it('should return follow status as true', async () => {
  const res = await request(app)
    .get(`/api/users/${userId}/is-following/${otherUserId}`)
    .set('Authorization', `Bearer ${userToken}`);

  expect(res.body.data.isFollowing).toBe(true);
});

it('should get following list', async () => {
  const res = await request(app).get(`/api/users/${userId}/following`);
  expect(res.body.data.length).toBeGreaterThan(0);
});
it('should get followers list', async () => {
  const res = await request(app).get(`/api/users/${otherUserId}/followers`);
  expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should unfollow the user', async () => {
  const res = await request(app)
    .post(`/api/users/${otherUserId}/unfollow`)
    .set('Authorization', `Bearer ${userToken}`);

  expect(res.statusCode).toBe(200);
  });
});