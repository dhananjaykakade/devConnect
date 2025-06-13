import request from 'supertest';
import app from '../app';
import prisma from '../helper/prisma.helper';

let token: string;
let postId: string;
let commentId: string;

beforeAll(async () => {
    // Clear existing data
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.refreshToken.deleteMany({})
  await prisma.notification.deleteMany({})
    await prisma.user.deleteMany({});
    // Create a test user for authentication
  const res = await request(app).post('/api/auth/register').send({
    username: 'testactionuser1',
    email: 'actionuser1@example.com',
    password: 'Test@1234',
    name: 'Test Action User',

  });
  if(res.status !== 201) {
    console.error('Error creating test user:', res.error);
  }
  token = res.body.data.accessToken;

  // Create a post for testing
  const postRes = await request(app)
    .post('/api/posts')
    .set('Authorization', `Bearer ${token}`)
    .send({
      content: 'Post for like/comment test',
      techTags: ['node', 'express'],
      media: 'https://chatgpt.com/c/684930b5-52e0-8002-a9b8-460345e0af97asdf.com/image.jpg',
    });

if (postRes.status !== 201) {
  console.error('Error creating post:', postRes.status, postRes.body);
}
  postId = postRes.body.data.id;
});

afterAll(async () => {
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.refreshToken.deleteMany({})
  await prisma.notification.deleteMany({})
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe('Post Like & Comment APIs', () => {
  // Like Post
  it('should like the post', async () => {
    const res = await request(app)
      .patch(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Post liked successfully');
  });

  // Unlike Post
  it('should unlike the post', async () => {
    const res = await request(app)
      .patch(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Post unliked successfully');
  });

  // Comment on Post
  it('should add a comment', async () => {
    const res = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'This is a test comment' });

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe('This is a test comment');

    commentId = res.body.data.id;
  });

  // Get Comments
  it('should fetch all comments of the post', async () => {
    const res = await request(app).get(`/api/posts/${postId}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].content).toBe('This is a test comment');
  });
});
