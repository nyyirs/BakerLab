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
 
export async function getAverageRequestStats() {
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
          where: {
            role: 'user' // Assuming 'user' role indicates a user request
          }
        }
      }
    })

    const requestCounts = conversations.map(conversation => ({
      conversationId: conversation.id,
      title: conversation.title,
      requestCount: conversation.chats.length
    }))

    const totalRequests = requestCounts.reduce((sum, conv) => sum + conv.requestCount, 0)
    const averageRequests = totalRequests / conversations.length

    return {
      userId: userId,
      conversations: requestCounts,
      totalRequests: totalRequests,
      averageRequests: Math.round(averageRequests * 100) / 100
    }
  } catch (error) {
    console.error('Error fetching average request stats:', error)
    throw new Error('Failed to fetch average request stats')
  }
}
  
export async function getTotalGeneratedContentStats() {
  try {
    const session = await getSession()
    if (!session || !session.user || !session.user.id) {
      throw new Error('User not authenticated')
    }

    // Count all assistant messages across all conversations
    const totalGeneratedContent = await prisma.chat.count({
      where: {
        role: 'assistant'
      }
    })

    // Get the count of generated content per user
    const userGeneratedContent = await prisma.user.findMany({
      include: {
        conversations: {
          include: {
            chats: {
              where: {
                role: 'assistant'
              }
            }
          }
        }
      }
    })

    const userStats = userGeneratedContent.map(user => ({
      userId: user.id,
      email: user.email,
      generatedContentCount: user.conversations.reduce((sum, conv) => sum + conv.chats.length, 0)
    }))

    return {
      totalGeneratedContent,
      userStats,
    }
  } catch (error) {
    console.error('Error fetching total generated content stats:', error)
    throw new Error('Failed to fetch total generated content stats')
  }
}
