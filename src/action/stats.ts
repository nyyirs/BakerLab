'use server'

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/getSession"

export async function getConversationStats() {
  try {
    const session = await getSession()
    if (!session || !session.user || !session.user.id) {
      throw new Error('User not authenticated')
    }

    const userId = session.user.id

    const stats = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        email: true,
        _count: {
          select: {
            conversations: true
          }
        }
      }
    })

    if (!stats) {
      throw new Error('User not found')
    }

    return {
      userId: stats.id,
      email: stats.email,
      conversationCount: stats._count.conversations
    }
  } catch (error) {
    console.error('Error fetching conversation stats:', error)
    throw new Error('Failed to fetch conversation stats')
  }
}

export async function getIterationStats() {
    try {
      const session = await getSession()
      if (!session || !session.user || !session.user.id) {
        throw new Error('User not authenticated')
      }
  
      const userId = session.user.id
  
      const conversations = await prisma.conversation.findMany({
        where: {
          userId: userId
        },
        include: {
          chats: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      })
  
      const iterationStats = conversations.map(conversation => {
        const iterationCount = conversation.chats.length
  
        return {
          conversationId: conversation.id,
          title: conversation.title,
          iterationCount: iterationCount,
        }
      })
  
      const averageIterations = iterationStats.reduce((sum, stat) => sum + stat.iterationCount, 0) / iterationStats.length
  
      return {
        userId: userId,
        conversations: iterationStats,
        averageIterations: isNaN(averageIterations) ? 0 : Math.round(averageIterations * 100) / 100
      }
    } catch (error) {
      console.error('Error fetching iteration stats:', error)
      throw new Error('Failed to fetch iteration stats')
    }
}
  
export async function getAverageTimeStats() {
    try {
      const session = await getSession()
      if (!session || !session.user || !session.user.id) {
        throw new Error('User not authenticated')
      }
  
      const userId = session.user.id
  
      const conversations = await prisma.conversation.findMany({
        where: {
          userId: userId
        },
        include: {
          chats: {
            orderBy: {
              createdAt: 'asc'
            },
            select: {
              createdAt: true
            }
          }
        }
      })
  
      const conversationTimes = conversations.map(conversation => {
        if (conversation.chats.length < 2) {
          return null // Skip conversations with less than 2 chats
        }
        const firstChat = conversation.chats[0]
        const lastChat = conversation.chats[conversation.chats.length - 1]
        const duration = lastChat.createdAt.getTime() - firstChat.createdAt.getTime()
        return {
          conversationId: conversation.id,
          title: conversation.title,
          duration: duration,
          durationInMinutes: Math.round(duration / (1000 * 60))
        }
      }).filter((time): time is NonNullable<typeof time> => time !== null)
  
      const totalDuration = conversationTimes.reduce((sum, time) => sum + time.duration, 0)
      const averageDuration = totalDuration / conversationTimes.length
  
      return {
        userId: userId,
        conversations: conversationTimes,
        averageDurationMs: averageDuration,
        averageDurationMinutes: Math.round(averageDuration / (1000 * 60))
      }
    } catch (error) {
      console.error('Error fetching average time stats:', error)
      throw new Error('Failed to fetch average time stats')
    }
}
  
  
