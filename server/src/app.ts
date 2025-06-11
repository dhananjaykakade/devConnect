import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import { ApiError } from './utils/ApiError'
import ResponseHandler from './utils/ApiResponse'
import { NotFoundHandler, ErrorHandler } from './middlewares/error.middleware'
// import routes from './routes' (you can add this later)

const app: Application = express()

// 🔐 Security and performance
app.use(helmet())
app.use(cors({
  origin: true,
  credentials: true
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
// app.use('/api/v1', routes)
// creating default route for testing
app.get('/', (req, res) => {
    ResponseHandler.success(res, 200, 'Welcome to the API', { version: '1.0.0' })
    })

app.get('/error', (req, res) => {
    throw new ApiError(500, 'This is a test error')
    })

// 🧩 API Error Handling


// 🧹 404 Handler
app.use(NotFoundHandler)

// 🔥 Global Error Handler
app.use(ErrorHandler)

export default app
