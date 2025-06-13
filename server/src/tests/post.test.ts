import request from 'supertest';
import app from '../app';
import prisma from '../helper/prisma.helper';


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


let token: string;



beforeAll(async () => {
  // Register users
  await request(app).post('/api/auth/register').send(testUser);
  await request(app).post('/api/auth/register').send(testOtherUser);

  // Login to get token
  const res = await request(app).post('/api/auth/login').send({
    email: testUser.email,
    password: testUser.password,
  });
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
  // Cleanup test users
  await prisma.refreshToken.deleteMany();
  await prisma.post.deleteMany({});
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});


describe('Post API', () => {
  let postId: string;

  it('should create a post', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'My first post',
        techTags: ['nestjs', 'prisma'],
        media: 'http://example.com/image.png'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe('My first post');
    postId = res.body.data.id;
  });

  it('should fetch post by id', async () => {
    const res = await request(app).get(`/api/posts/all/${postId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(postId);
  });

  it('should update post', async () => {
    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Updated content' });

    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe('Updated content');
  });

  it('should delete post', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});