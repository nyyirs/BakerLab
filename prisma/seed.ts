import { PrismaClient, Role } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await hash('admin', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bakerlab.com' },
    update: {},
    create: {
      email: 'admin@bakerlab.com',
      password: hashedPassword,
      role: Role.ADMIN,
      isAdmin: true
    },
  })

  console.log({ admin })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })