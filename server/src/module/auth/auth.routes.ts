import { Router } from 'express'
import { register,refreshToken,login,getProfile ,updateProfile,logout} from './auth.controller'
import {authenticate } from '../../middlewares/auth.middleware'
import { rateLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router()

router.post('/register',rateLimiter, register)
router.get('/refresh', refreshToken)
router.post('/login',rateLimiter, login)
router.get('/profile', authenticate, getProfile)
router.put('/profile', authenticate , updateProfile)
router.post('/logout',authenticate, logout);
router.get('/test-cookies', (req, res) => {
  res.cookie('test_cookie', 'value', {
    httpOnly: true,
    secure: false, // Adjust for environment
    sameSite: 'lax'
  });
  res.json({ success: true });
});
router.get('/verify-cookies', (req, res) => {
  // Log all cookies received
  console.log('Received cookies:', req.cookies);
  
  // Check if test cookie exists
  const hasTestCookie = 'test_cookie' in req.cookies;
  
  res.json({
    success: true,
    cookiesReceived: req.cookies,
    testCookiePresent: hasTestCookie
  });
})
export default router
