import request from 'supertest';
import app from '../app';
import prisma from '../helper/prisma.helper';
import { be } from '@upstash/redis/zmscore-DzNHSWxc';


describe('Auth Routes', () => {
  let authToken: string;

  const testUser = {
    name: 'Test User',
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'test1234'
  };

  beforeAll(async () => {
    // Cleanup any existing users and refresh tokens
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });
  afterAll(async () => {
    // Cleanup test use

    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it('should register a new user and set cookies', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('user');

    // ✅ Check that cookies are set
    const setCookies = res.headers['set-cookie'];
    expect(setCookies).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^accessToken=.*HttpOnly/),
        expect.stringMatching(/^refreshToken=.*HttpOnly/),
      ])
    );
  });

  it('should login the user with correct credentials and set cookies', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('user');

    const setCookies = res.headers['set-cookie'];
    expect(setCookies).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^accessToken=.*HttpOnly/),
        expect.stringMatching(/^refreshToken=.*HttpOnly/),
      ])
    );

    // Optional: Store the accessToken from cookie if needed in future tests
    const cookiesArray = Array.isArray(setCookies) ? setCookies : [setCookies];
    authToken = cookiesArray.find((c) => c.startsWith('accessToken='));
    console.log('Auth Token:', authToken);
    authToken = authToken ? authToken.split(';')[0].split('=')[1] : '';
    expect(authToken).toBeDefined();
  });

  it('should fail login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpass' });

    expect(res.statusCode).toBe(401);
  });

  it('should fetch user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('email', testUser.email);
  });

  it('should fail to fetch profile without token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.statusCode).toBe(401);
  });


});


