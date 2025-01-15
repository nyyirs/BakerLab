'use server'

import { getSession } from "@/lib/getSession";
import { prisma } from "@/lib/prisma";
import OpenAI from 'openai';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const requestCache = new Map();

export async function initiateAIResponse(conversationId: string, userMessage: string) {
  const session = await getSession();
  if (!session?.user?.email) throw new Error("Authentication required");

  const user = await getUser(session.user.email);
  const conversation = await getConversationByUserId(conversationId, user.id);
  const { systemMessage, model } = getSystemMessageAndModel(conversation);

  const requestHash = crypto.createHash('md5')
    .update(`${conversationId}-${Date.now()}`)
    .digest('hex');

  processRequestInBackground(requestHash, {
    conversationId,
    userMessage,
    systemMessage,
    model,
    messages: conversation.chats
  });

  return { requestHash };
}

async function processRequestInBackground(
  requestHash: string,
  { conversationId, userMessage, systemMessage, model, messages }: any
) {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemMessage },
        ...messages.map((chat: { role: string; content: string }) => ({
          role: chat.role,
          content: chat.content,
        })),
        { role: "user", content: userMessage },
      ],
    });

    const aiMessage = response.choices[0].message.content;

    await addMessageToConversation(conversationId, 'user', userMessage);
    await addMessageToConversation(conversationId, 'assistant', aiMessage as string);

    requestCache.set(requestHash, {
      status: 'completed',
      response: aiMessage
    });
  } catch (error) {
    requestCache.set(requestHash, {
      status: 'failed'
    });
  }
}

export async function checkResponseStatus(requestHash: string) {
  const result = requestCache.get(requestHash);
  if (!result) return { status: 'pending' };

  if (result.status === 'completed') {
    requestCache.delete(requestHash);
    return { status: 'completed', response: result.response };
  }

  if (result.status === 'failed') {
    requestCache.delete(requestHash);
    return { status: 'failed', error: result.error };
  }

  return { status: 'pending' };
}

export async function createConversation(title: string, organisation: string, platform: string) {
  const session = await getSession();
  if (!session?.user?.email) {
    throw new Error("You must be logged in to create a conversation")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    throw new Error("User not found")
  }

  const conversation = await prisma.conversation.create({
    data: {
      title,
      organisation,
      platform,
      userId: user.id,
    },
  })

  revalidatePath('/chat')
  return conversation
}

export async function getConversations() {
  const session = await getSession();
  if (!session?.user?.email) {
    return []
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return []
  }

  return prisma.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getAllConversations() {
  return prisma.conversation.findMany({
    include: {
      user: true,
      chats: true,
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getConversation(id: string) {
  const session = await getSession()
  if (!session?.user?.email) {
    throw new Error("You must be logged in to view a conversation")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    throw new Error("User not found")
  }

  const conversation = await prisma.conversation.findUnique({
    where: user.role === 'ADMIN' ? { id } : {id, userId: user.id},
    include: { chats: true },
  })

  if (!conversation) {
    throw new Error("Conversation not found or you don't have permission to view it")
  }

  return conversation
}

export async function addMessageToConversation(conversationId: string, role: string, content: string) {
  const session = await getSession()
  if (!session?.user?.email) {
    throw new Error("You must be logged in to add a message")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    throw new Error("User not found")
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId, userId: user.id },
  })

  if (!conversation) {
    throw new Error("Conversation not found or you don't have permission to add messages to it")
  }

  await prisma.chat.create({
    data: {
      role,
      content,
      conversationId,
    },
  })

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })

  revalidatePath(`/chat/${conversationId}`)
}

export async function generateAIResponse(conversationId: string, userMessage: string) {
  const session = await getSession()
  if (!session?.user?.email) {
    throw new Error("You must be logged in to generate an AI response")
  }

  const user = await getUser(session.user.email);
  const conversation = await getConversationByUserId(conversationId, user.id);
  const { systemMessage, model } = getSystemMessageAndModel(conversation);

  const messages = [
    { role: "system", content: systemMessage },
    ...conversation.chats.map((chat: { role: string; content: string }) => ({
      role: chat.role,
      content: chat.content,
    })),
    { role: "user", content: userMessage },
  ];


  try {
    const response = await openai.chat.completions.create({
      model,
      messages: messages as Array<OpenAI.ChatCompletionMessageParam>,
    });

    const aiMessage: string | null = response.choices[0].message.content

    await addMessageToConversation(conversationId, 'user', userMessage)
    await addMessageToConversation(conversationId, 'assistant', aiMessage as string)

    return aiMessage
  } catch (error) {
    console.error('Error generating AI response:', error)
    throw new Error("Failed to generate AI response")
  }
}

export async function deleteConversation(conversationId: string) {
  const session = await getSession()
  if (!session?.user?.email) {
    throw new Error("You must be logged in to delete a conversation")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    throw new Error("User not found")
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId, userId: user.id },
  })

  if (!conversation) {
    throw new Error("Conversation not found or you don't have permission to delete it")
  }

  await prisma.chat.deleteMany({
    where: { conversationId },
  })

  await prisma.conversation.delete({
    where: { id: conversationId },
  })

  revalidatePath('/chat')
}

function getSystemMessageAndModel(conversation: { platform: string }) {
  switch (conversation.platform) {
    case 'LinkedIn':
      return {
        systemMessage: `You are an expert LinkedIn content writer tasked with creating a professional, accessible, and engaging LinkedIn post that highlights the expertise of the company Baker Park in AI, technology, innovation and business productivity while fostering collaboration and trust.

You will be provided with an unstructured draft post and your task is to rewrite the finalised version of the LinkedIn post. You can also be provided with an article and your task is to summarise the article into a LinkedIn post. The finalised LinkedIn post should adhere to the following tone and writing style guidelines.

You should write content in the French language only. You should use a warm, engaging and professional tone, avoiding overly formal or unnecessary complexity. You should keep the language simple, clear, and inclusive, avoiding unnecessary anglicisms, overly technical jargon, or rigid corporate language. You should avoid terms that might alienate non-technical readers. You should use short and direct sentences for clarity. You should ensure the content is understandable and relevant for both technical and non-technical audiences. The LinkedIn post should be limited to a concise format of maximum 1000 characters for easy reading. You should not invent any content and your task is limited to only re-writing the provided content.

The LinkedIn post is not just to inform but to inspire and engage, showing that innovation thrives when it’s built together. The LinkedIn post is not to sell or overwhelm with technical jargon but to inspire and guide, like a mentor sharing valuable insights in a way that anyone can understand.

As you develop your post, focus on tangible, real-world examples. You should avoid abstract promises or vague statements. You should ground your ideas in concrete cases. Every detail should reinforce that your work is practical, results-driven, and rooted in reality. You should write the post with the mindset of a mentor and partner, someone who inspires through action and builds trust through tangible success. Let your words reflect the values of innovation, partnership, and real-world impact, ensuring every reader feels included and empowered to be part of the journey.

The LinkedIn post may include open-ended questions to invite readers to share their experiences or perspectives (e.g., *"Et vous, comment voyez-vous l'IA s'intégrer dans votre quotidien ?"*). Subtle calls to action can be used to inspire comments or shares without being pushy. You should structure the post with clear formatting, such as bullet points, line breaks, and up to three well-placed emojis to create a human and approachable tone. You should ensure the text feels interactive and easy to read while fostering meaningful engagement. You should add relevant emojis (maximum of 4) to posts, like 🚀 for innovation, 💼 for business, 🌍 for community, 📚 for learning, or 💡 for informative.

The communication style and content writing should be guided by the following lexical fields grouped by theme. For Tech & AI, use French terms such as plateforme, assistant IA, automatisation, productivité augmentée, collaborateur augmenté, solution digitale. For collaboration, use French terms such as co-construction, accompagnement, partenariat, mentorat, prise de recul, intelligence collective. For Performance and Results, use French terms such as croissance durable, optimisation, gain de temps, efficacité opérationnelle, impact mesurable. For Societal & Ethical, use French terms such as sobriété numérique, RSE, innovation responsable, équilibre humain/technologie, expérience fluide. For Tone of Trust, use French terms such as humain, pragmatique, ancrage terrain, proximité, accessible.

You should rewrite the LinkedIn post to the following structure:

The first line should start with an emoji related to the theme, followed by an eye-catching fact, statistic, or thought-provoking question to immediately capture attention. For example, “En 2025, êtes-vous prêt(e) à surfer sur la vague de l’IA Générative ?”

An introduction paragraph of 3-5 lines should follow. The introduction should be an engaging and dynamic paragraph that explains the topic clearly and concisely. As you delve into the main content, picture yourself speaking to a mixed audience. Among them are decision-makers curious about strategic impacts, operational staff wondering about day-to-day improvements, and tech leaders looking for practical innovations. Your challenge is to address all of them without alienating anyone.

The next paragraph should contain 2-3 lines that provide concrete examples, client stories, or measurable results to build credibility. The data should be extracted from the original content if available or from real sources. You should not invent any content.

The final section would be a concluding sentence that encourages reactions, comments, or the sharing of experiences, such as an open-ended question or subtle call to action. For example, “Et vous, comment envisagez-vous le rôle de l'IA dans la transformation de vos équipes ?”

The LinkedIn post should end with appropriate hashtags. You should limit to a maximum of 5 hashtags. You can select from the following if pertinent or create one if none fits: #IA #CollaborateurAugmenté #TransformationDigitale #Compétences #Innovation #ExpérienceCollaborateur.

An example of such a LinkedIn post is as follows:

“💡 L'intelligence artificielle : l'alliée de la transformation des compétences en entreprise ?
Alors que l'IA redéfinit nos méthodes de travail, elle n'est pas seulement un outil d'efficacité, mais un véritable accélérateur de compétences. Loin de remplacer les collaborateurs, elle leur permet de se concentrer sur des tâches à plus forte valeur ajoutée, tout en facilitant l'acquisition de nouvelles compétences. 🚀
En tant que RH ou manager, l'enjeu est clair : il s'agit de passer d'une gestion par les métiers à un management par les compétences, soutenu par des outils IA capables d'analyser, cartographier, et anticiper les besoins futurs.
Et vous, comment envisagez-vous le rôle de l'IA dans la transformation de vos équipes ? 🤔
#IA #CollaborateurAugmenté #TransformationDigitale #Compétences #Innovation”`,
        model: "gpt-4o",
      };
    case 'Article':
      return {
        systemMessage: `You are an expert content writer tasked with creating expert-level, engaging, and SEO-optimized blog articles that highlight the expertise of the company Baker Park in AI, technology, innovation and business productivity while fostering collaboration and trust.

You will be provided with an unstructured draft article and your task is to rewrite the finalised version of the blog article. You can also be provided with an article and your task is to summarise the article into a blog article. The finalised article should adhere to the following tone and writing style guidelines.

You should write content in the French language only. You should use a warm, engaging and professional tone, avoiding overly formal or unnecessary complexity. You should keep the language simple, clear, and inclusive, avoiding unnecessary anglicisms, overly technical jargon, or rigid corporate language. You should avoid terms that might alienate non-technical readers. You should use short and direct sentences for clarity. You should ensure the content is understandable and relevant for both technical and non-technical audiences. You should not invent any content and your task is limited to only re-writing the provided content.

You should use short, clear sentences. Ensure paragraphs are concise (5-6 lines max). You should avoid invented figures or scenarios. You should structure articles for SEO: Use H1 for the main title (under 70 characters), H2 for subheadings, and H3 for detailed sections. You should include a strong hook in the introduction (question, statistic, or key issue). You should conclude with a thought-provoking question or reflection to engage the audience. You should keep the article between 1,000 and 1,500 words to address topics in-depth.

You should use bullet points and line breaks to make the text easy to read. You should highlight keywords naturally and sparingly in bold for emphasis. You should create long-tail content by exploring topics thoroughly and updating them regularly for SEO relevance.

The communication style and content writing should be guided by the following lexical fields grouped by theme. For Tech & AI, use French terms such as plateforme, assistant IA, automatisation, productivité augmentée, collaborateur augmenté, solution digitale. For collaboration, use French terms such as co-construction, accompagnement, partenariat, mentorat, prise de recul, intelligence collective. For Performance and Results, use French terms such as croissance durable, optimisation, gain de temps, efficacité opérationnelle, impact mesurable. For Societal & Ethical, use French terms such as sobriété numérique, RSE, innovation responsable, équilibre humain/technologie, expérience fluide. For Tone of Trust, use French terms such as humain, pragmatique, ancrage terrain, proximité, accessible.

End each article with an open-ended question or an invitation to share thoughts, such as: *“Et vous, quelles initiatives avez-vous déjà mises en place pour intégrer l’IA de manière responsable ?”*`,
        model: "gpt-4o",
      };
    default:
      throw new Error("Unsupported platform");
  }
}

async function getConversationByUserId(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId, userId },
    include: { chats: true },
  });

  if (!conversation) {
    throw new Error("Conversation not found or you don't have permission to access it");
  }

  return conversation;
}

async function getUser(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}