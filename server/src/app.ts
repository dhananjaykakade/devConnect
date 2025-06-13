import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit';
import { NotFoundHandler, ErrorHandler } from './middlewares/error.middleware'
// import routes from './routes' (you can add this later)
import authRoutes from './module/auth/auth.routes'
import postRoutes from './module/post/post.routes'
import userRoutes from './module/user/user.route'
import notificationRoute from './module/notification/notification.route'



const app: Express = express()

// 🔐 Security and performance
app.use(helmet())
app.use(cors({

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Total-Count'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400, // 24 hours
  // You can also specify allowed origins if needed
  origin: ['http://localhost:5173', 'https://yourdomain.com'],
}))
app.use(compression())

// 🍪 Cookie & JSON parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// 📝 Logging
app.use(morgan('dev'))
// app.use(pinoHttp({ logger }))
// 📦 Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth',rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/users', userRoutes)
app.use('/api/notifications', notificationRoute)

// 🧩 API Error Handling



// 🧹 404 Handler
app.use(NotFoundHandler)

// 🔥 Global Error Handler
app.use(ErrorHandler)


export default app
