import request from 'supertest';
import app from '../app';

describe('Health Check', () => {
  it('should return 200 OK', async () => {
    const res = await request(app).get('/api/health'); // or your health route
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Server is healthy'); // Adjust based on your handler
  });
});