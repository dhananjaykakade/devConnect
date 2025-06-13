import request from 'supertest';
import app from '../app';
import prisma from '../helper/prisma.helper';


let token: string;
let postId: string;

beforeAll(async () => {
  const res = await request(app).post('/api/auth/register').send({
    username: 'postextrasuser',
    email: 'postextras@example.com',
    password: 'Test@1234',
    name: 'Post Extras User',
  });
  token = res.body.data.accessToken;

  const postRes = await request(app)
    .post('/api/posts')
    .set('Authorization', `Bearer ${token}`)
    .send({
      content: 'Testing flag/report/feed',
      techTags: ['go', 'typescript'],
      media: 'https://test.com/image.jpg',
    });

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


describe('Post Extras - Flag, Report, Feed', () => {

      it('should fetch all posts in feed', async () => {
    const res = await request(app)
      .get('/api/posts/all')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    console.log(res.body.data.posts);
    expect(res.body.data.posts.length).toBeGreaterThan(0);
  });
  
  it('should flag the post', async () => {
    const res = await request(app)
      .patch(`/api/posts/${postId}/flag`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Post flagged successfully');
  });



  it('should fetch single post by ID', async () => {
    const res = await request(app)
      .get(`/api/posts/all/${postId}`)
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(postId);
  });
});
