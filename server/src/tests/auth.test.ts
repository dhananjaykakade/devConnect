import request from 'supertest';
import app from '../app';
import prisma from '../helper/prisma.helper';


describe('Auth Routes', () => {
  let authToken: string;

  const testUser = {
    name: 'Test User',
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'test1234'
  };

  afterAll(async () => {
    // Cleanup test use
    const user = await prisma.user.findUnique({
      where: { email: testUser.email }
    });
    if (user) {
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    }

    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  it('should login the user with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    authToken = res.body.data.accessToken;
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


