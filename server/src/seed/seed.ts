// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

async function main() {
  // Create users
  const users = await Promise.all(
    Array.from({ length: 10 }).map(async () => {
      const user = await prisma.user.create({
        data: {
          username: faker.internet.userName(),
          email: faker.internet.email(),
          password: faker.internet.password(),
          bio: faker.lorem.sentence(),
          avatar: faker.image.avatar(),
          techStack: faker.helpers.arrayElements([
            'Node.js', 'React', 'MongoDB', 'TypeScript', 'GraphQL', 'Docker'
          ], 3),
        }
      })
      return user
    })
  )

  // Create posts
  const posts = await Promise.all(
    Array.from({ length: 10 }).map(async () => {
      const author = faker.helpers.arrayElement(users)
      const post = await prisma.post.create({
        data: {
          content: faker.lorem.paragraph(),
          techTags: faker.helpers.arrayElements(['React', 'Node.js', 'TS', 'MongoDB'], 2),
          authorId: author.id,
        }
      })
      return post
    })
  )

  // Create comments
  const comments = await Promise.all(
    Array.from({ length: 10 }).map(async () => {
      const author = faker.helpers.arrayElement(users)
      const post = faker.helpers.arrayElement(posts)
      const comment = await prisma.comment.create({
        data: {
          content: faker.lorem.sentence(),
          authorId: author.id,
          postId: post.id,
        }
      })
      return comment
    })
  )

  // Create reports
  const reports = await Promise.all(
    Array.from({ length: 10 }).map(async () => {
      const reporter = faker.helpers.arrayElement(users)
      const post = faker.helpers.arrayElement(posts)
      const report = await prisma.report.create({
        data: {
          reason: faker.lorem.words(5),
          reporterId: reporter.id,
          postId: post.id,
        }
      })
      return report
    })
  )

  // Create notifications
  const notifications = await Promise.all(
    Array.from({ length: 10 }).map(async () => {
      const receiver = faker.helpers.arrayElement(users)
      const notification = await prisma.notification.create({
        data: {
          receiverId: receiver.id,
          type: faker.helpers.arrayElement(['FOLLOW', 'LIKE', 'COMMENT', 'MENTION']),
          message: faker.lorem.sentence(),
          link: faker.internet.url(),
        }
      })
      return notification
    })
  )

  console.log('✅ Seed data created successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
