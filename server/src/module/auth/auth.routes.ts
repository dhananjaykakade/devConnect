import { Router } from 'express'
import { register,refreshToken,login,getProfile ,updateProfile,logout} from './auth.controller'
import {authenticate } from '../../middlewares/auth.middleware'
import { rateLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router()

router.post('/register',rateLimiter, register)
router.post('/refresh', refreshToken)
router.post('/login',rateLimiter, login)
router.get('/profile', authenticate, getProfile)
router.put('/profile', authenticate , updateProfile)
router.post('/logout',authenticate, logout);

export default router
