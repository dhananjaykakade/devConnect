# DevConnect Backend

A scalable, production-ready backend for **DevConnect** – a developer-centric social media platform. Built with TypeScript, Express.js, Prisma, and MongoDB, this API supports user authentication, posting, commenting, liking, following, real-time notifications, and more.

---

## 🚀 Tech Stack

| Layer          | Technology         |
|----------------|--------------------|
| Runtime        | Node.js            |
| Language       | TypeScript         |
| Framework      | Express.js         |
| ORM            | Prisma             |
| Database       | MongoDB (via Prisma)|
| WebSockets     | `ws`               |
| Auth           | JWT, Bcrypt        |
| Validation     | Zod                |
| Logging        | Pino               |
| Testing        | Jest, Supertest    |
| Documentation  | Swagger (JSDoc)    |
| Dev Tools      | pnpm, tsx, nodemon |

---

## 📁 Folder Structure


## src/

- **config/** – Environment configuration
- **middleware/** – Auth middleware, error handlers, etc.
- **module/**
  - **auth/** – Register, login, logout, token refresh
  - **user/** – Profile, follow/unfollow
  - **post/** – Create, read, delete, like, comment
  - **notification/** – Realtime and API-based notifications
- **tests/** – Jest test cases
- **utils/** – Response handler, logger, Prisma helpers
- **websocket/** – WebSocket server and connection setup
- **app.ts** – Express app instance
- **server.ts** – HTTP + WebSocket server entry point

## prisma/

- **schema.prisma** – Prisma data model
- **seed.ts** – Optional seed data script

## Other Files

- **.env** – Main environment variables
- **.env.test** – Testing environment variables
- **jest.config.ts** – Jest testing configuration
- **tsconfig.json** – TypeScript compiler configuration
- **package.json** – Scripts and dependencies
- **README.md** – Project documentation

---
## 📦 Packages Used

| Package                               | Purpose                               |
| ------------------------------------- | ------------------------------------- |
| `express`                             | HTTP server                           |
| `zod`                                 | Schema validation                     |
| `bcrypt`                              | Password hashing                      |
| `jsonwebtoken`                        | JWT handling                          |
| `pino`                                | Logging                               |
| `ws`                                  | WebSocket for real-time communication |
| `jest`                                | Unit/integration testing              |
| `supertest`                           | API request testing                   |
| `swagger-jsdoc`, `swagger-ui-express` | API docs                              |


---

## 🔐 Authentication

- Uses **JWT** for access/refresh tokens  
- Passwords are hashed with **bcrypt**  
- Middleware ensures route protection  
- Includes route protection and role-based access

---

## 🔄 Realtime Notifications

- Built using `ws` WebSocket server  
- `clients` map stores active user socket connections  
- Notifications are triggered on:
  - Like
  - Comment
  - Follow

---

## 🧪 Testing

- Written with **Jest** and **Supertest**  
- Integration test coverage for all routes:
  - Auth
  - Users
  - Posts
  - Notifications
- Runs in isolated **MongoDB** test environment

---

## 📄 API Documentation

- Swagger UI served via `/api/docs`  
- JSDoc + Swagger annotations in route files  
- Example:

```ts
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             ...
 **/
```
---

## ✅ Setup Instructions

# Install dependencies
```bash
pnpm install
```

Start development server
```bash
pnpm dev
```
Run tests
```bash
pnpm test:latest
```
Build for production
```bash
pnpm build
```
---
