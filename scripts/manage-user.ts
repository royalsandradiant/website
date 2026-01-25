/**
 * User Management Script for BetterAuth
 * 
 * Usage:
 *   bun run scripts/manage-user.ts create <email> <password> [name]
 *   bun run scripts/manage-user.ts update <email> --password <new-password>
 *   bun run scripts/manage-user.ts update <email> --name <new-name>
 *   bun run scripts/manage-user.ts delete <email>
 *   bun run scripts/manage-user.ts list
 * 
 * Examples:
 *   bun run scripts/manage-user.ts create admin@store.com mypassword123 "John Doe"
 *   bun run scripts/manage-user.ts update admin@store.com --password newpassword456
 *   bun run scripts/manage-user.ts list
 */

import { auth } from '../src/lib/auth'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

// We use the prisma instance from the app to ensure consistent configuration
import { prisma } from '../src/app/lib/prisma'

async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10)
}

async function createUser(email: string, password: string, name?: string) {
  try {
    // BetterAuth handles hashing and database creation correctly
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: name || email.split('@')[0],
      },
    })
    
    console.log(`✅ User created successfully!`)
    console.log(`   Email: ${email}`)
    console.log(`   Name: ${name || email.split('@')[0]}`)
  } catch (error) {
    console.error('❌ Failed to create user:', error)
    throw error
  }
}

async function updateUser(email: string, args: string[]) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.log('❌ User not found.')
    return
  }

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i]
    const value = args[i + 1]
    
    if (flag === '--password') {
      const hashedPassword = await hashPassword(value)
      await prisma.account.updateMany({
        where: { userId: user.id, providerId: 'credential' },
        data: { password: hashedPassword },
      })
      console.log(`✅ Password updated for ${email}`)
    } else if (flag === '--name') {
      await prisma.user.update({
        where: { email },
        data: { name: value },
      })
      console.log(`✅ Name updated for ${email}`)
    }
  }
}

async function deleteUser(email: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.log('❌ User not found.')
    return
  }

  // Delete user (cascades to sessions and accounts)
  await prisma.user.delete({
    where: { email },
  })
  
  console.log(`✅ User ${email} deleted successfully!`)
}

async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  
  console.log('\n📋 Users in database:\n')
  console.log('─'.repeat(80))
  
  if (users.length === 0) {
    console.log('No users found.')
  } else {
    for (const user of users) {
      console.log(`Email: ${user.email}`)
      console.log(`Name: ${user.name || '(not set)'}`)
      console.log(`Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`)
      console.log(`Created: ${user.createdAt.toLocaleDateString()}`)
      console.log('─'.repeat(80))
    }
  }
  
  console.log(`\nTotal: ${users.length} user(s)`)
}

async function main() {
  const [command, ...args] = process.argv.slice(2)
  
  if (!command) {
    console.log(`
User Management Script (BetterAuth)

Usage:
  bun run scripts/manage-user.ts <command> [options]

Commands:
  create <email> <password> [name]    Create a new user
  update <email> --password <pass>    Update user's password
  update <email> --name <name>        Update user's name
  delete <email>                      Delete a user
  list                                List all users

Examples:
  bun run scripts/manage-user.ts create admin@store.com secret123 "Admin"
  bun run scripts/manage-user.ts update admin@store.com --password newpass123
  bun run scripts/manage-user.ts list
`)
    return
  }
  
  try {
    switch (command) {
      case 'create':
        if (args.length < 2) {
          console.log('❌ Usage: create <email> <password> [name]')
          return
        }
        await createUser(args[0], args[1], args[2])
        break
        
      case 'update':
        if (args.length < 3) {
          console.log('❌ Usage: update <email> --password|--name <value>')
          return
        }
        await updateUser(args[0], args.slice(1))
        break
        
      case 'delete':
        if (!args[0]) {
          console.log('❌ Usage: delete <email>')
          return
        }
        await deleteUser(args[0])
        break
        
      case 'list':
        await listUsers()
        break
        
      default:
        console.log(`❌ Unknown command: ${command}`)
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        console.log('❌ A user with this email already exists.')
      } else if (error.message.includes('Record to update not found') || error.message.includes('Record to delete does not exist')) {
        console.log('❌ User not found.')
      } else {
        console.error('❌ Error:', error.message)
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
