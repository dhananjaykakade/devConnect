import { Router } from 'express'
import { register,refreshToken,login } from './auth.controller'

const router = Router()

router.post('/register', register)
router.post('/refresh', refreshToken)
router.post('/login', login)

export default router
