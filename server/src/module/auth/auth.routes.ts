import { Router } from 'express'
import { register,refreshToken,login,getProfile ,updateProfile,logout} from './auth.controller'
import {authenticate } from '../../middlewares/auth.middleware'

const router = Router()

router.post('/register', register)
router.post('/refresh', refreshToken)
router.post('/login', login)
router.get('/profile', authenticate, getProfile)
router.put('/profile', authenticate , updateProfile)
router.post('/logout',authenticate, logout);

export default router
