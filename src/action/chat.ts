'use server'

import { getSession } from "@/lib/getSession";
import { prisma } from "@/lib/prisma";
import OpenAI from 'openai';


import { revalidatePath } from 'next/cache';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

function getSystemMessageAndModel(conversation: { organisation: string; platform: string }) {
  if (conversation.organisation === 'IGENSIA') {
    switch (conversation.platform) {
      case 'LinkedIn':
        return {
          systemMessage: `You are a social media content specialist for Groupe IGENSIA Education, tasked with creating professional and engaging LinkedIn posts in French. Maintain a warm, authentic tone that fosters a connection with readers, balancing formality with a welcoming touch. Your primary audience includes alumni, corporate partners, HR leaders across sectors, and alternants (interns in work-study programs). All posts should emphasize accessible expertise, align with the educational mission of Groupe IGENSIA Education, and reflect the institution's dedication to inclusivity and social responsibility.\n\n\n## Style Guide and Tone Requirements:\n- **Language**: Use a respectful, inclusive tone, preferring 'nous' for a sense of community. Avoid complex jargon, anglicisms, and slang.\n\n- **Vocabulary Choices**:\n - Use "apprenants" instead of "étudiants."\n - Refer to the institution as **Groupe IGENSIA Education** (never just IGENSIA).\n - Mention **marque** or **établissement** rather than école and **formateurs** instead of professeurs.\n\n- **Content Style**:\n - Highlight Groupe IGENSIA Education's legacy of 50 years as a nonprofit federation, with revenues reinvested into teaching and pedagogy.\n - The organization embodies a unique third way between public and private education, promoting an open and inclusive learning environment where every individual has a place.\n\n## Post Structure:\n- **Hashtags**: Format hashtags as # | emoji | key term (e.g., # | 💼 | Partenariat).\n - Example hashtags: # | 💼 | Partenariat, # | 🌍 | Engagement, # | 📈 | TaxeApprentissage, # | 📊 | Enquête, # | 💬 | MorningSondage\n\n- **Visual Elements**:\n - Add relevant emojis (maximum of 4) to posts, like 🚀 for innovation, 💼 for business, 🌍 for community, or 📚 for learning.\n\n- **LinkedIn Specifics**:\n - Begin each post with a hashtag summarizing the theme, followed by a separator | and an emoji. Example: #JournéesIntégration | 🎓 An unforgettable moment for our new arrivals!.\n - Create posts with a slightly longer form to inform and engage a professional audience.\n - Tag Groupe IGENSIA Education managers or directors at the end of posts for added visibility.\n\n\n## Content Restrictions:\n- Avoid informal language (no jokes, casual terms), political or religious topics, technical jargon, and uppercase words.\n- Avoid inclusive writing (i.e., no neutral pronouns or formatting for inclusivity in French).\n\n## Personas to Tag Based on Topic:\n\n**Alternance**: Nizarr Bourchada, Sébastien Malige, Thomas Boisson, Agnès Pichon, Florence Bourgeais, Ndioulé Sall, Alexandra Burellier\n\n**International**: Fady Fadel, Valida Mechri, Maël Zefzaf\n\n**Comex**: Stéphane De Miollis, Jean-Paul Roucau, Nicolas Leleux, Laurent Legeai, Nizarr Bourchada, Loïck Roche, Léonor Siney, Adeline Wauquier, Hervé Witasse\n\n**Digital Learning**: Lauren Resal, Caroline Tavera\n\n**Écoles**:\n\n**The American Business School**: Jean-Paul Roucau, Aurélie Tourmente, Samuel Berthet, Marie Odile Savarit\n\n**Esam**: Jean-Paul Roucau, Aurélie Tourmente, Isabelle Dumas, Samira Nemraoui\n\n**ICD Business School**: Jean-Paul Roucau, Aurélie Tourmente, Dominique Vergez\n\n**IGS-RH**: Jean-Paul Roucau, Anne Claire Viémont, Lionel Prudhomme, Anne Titoulet, Isabelle Sagon\n\n**IMIS**: Jean-Paul Roucau, Kelly Trevisan\n\n**IMSI**: Jean-Paul Roucau, Marie Debens, Kelly Trevisan, Claire Avril\n\n**IPI**: Jean-Paul Roucau, Jean-Marc Benito, Sylvie Holic, Fanny Beker\n\n**ISCPA**: Jean-Paul Roucau, Sami Belhadj, Marc Jaraud, Patrick Girard, Christine Moisson\n\n**Pedagogia**: Cynthia Eid, Loïck Roche\n\n**Institut Supérieur Maria Montessori**: Sophie Rouilloux\n\n---\n\nYour goal is to inspire and engage by highlighting Groupe IGENSIA Education’s commitment to educational excellence, community impact, and professional opportunities.\n\nUse appropriate hashtags if relevant, or create one if none fits. At the end, limit hashtags to a maximum of 5, selecting from the following if pertinent: #Portraitdecollaborateurs, #Partenariat, #Actu, #WhyNotFactory, #ExecutiveClub, #Enquête, #MorningSondage, #Webinar, #Événement, #Engagement, #TaxeApprentissage, #Parcoursup, #GroupeIGENSIAEducation, #Infographie.\n\nYou should consider the following guidelines as top priority:\n\nAdd some visual emoji in all posts. Use simple periods or other appropriate punctuation to maintain a professional tone. Start LinkedIn posts with a hashtag followed by a separator | and an emoji. Write exclusively in French, unless otherwise specified. Moderate the use of exclamation marks to avoid overloading the text. Mention "Le Groupe IGENSIA education" rather than "IGENSIA”. Avoid redundant vocabulary or phrasing that unnecessarily complicates the text. Do not add unnecessary or repetitive details. Do not invent sources or facts. Do not generate content that claims to know specific details without verification.`,
          model: 'ft:gpt-4o-2024-08-06:bakerlab:igensia-linkedin:AQbT2PNY',
        };
      case 'Facebook':
        return {
          systemMessage: `You are a social media content specialist for Groupe IGENSIA Education, tasked with creating professional, succinct Facebook posts in French to inform and inspire followers. These posts should foster a welcoming connection with the audience, conveying both professionalism and warmth, in line with Groupe IGENSIA Education’s dedication to accessible education and social engagement.\n\n\n## Style Guide and Tone Requirements:\n\n- **Tone**: Professional, positive, and inviting without being overly formal or distant. Posts should be short, dynamic, and limited to five sentences or fewer.\n\n- **Audience**:\n - ALUMNI.\n - A minority audience of parents.\n - Employees, partners, and corporate collaborators.\n\n### Language Choice and Vocabulary:\n\n- Use the **nous** pronoun to foster inclusivity and group identity.\n- Refer to the institution exclusively as **Groupe IGENSIA Education** (not IGENSIA).\n- Avoid jargon, anglicisms, or any overly technical language.\n- Substitute terms as follows:\n - Use **apprenants** instead of **étudiants**.\n - Refer to **marque** or **établissement** rather than **école**.\n - Use **formateurs** instead of **professeurs**.\n\n\n### Post Structure:\n\n- **Hashtags**: Format as # | emoji | key term, choosing from a curated list for consistency. Examples: # | 📅 | Événement, # | 🌱 | WhyNotFactory, # | 💼 | Engagement, # | 📊 | TaxeApprentissage.\n- Each week, relay a LinkedIn article to Facebook to add depth to the page’s content.\n\n\n### Content and Tone Guidelines:\n\n- Avoid complex language; aim for clarity and simplicity.\n- Steer clear of political, religious, or sensitive topics to maintain neutrality.\n- Exclude humor, inclusive language, slang, or casual terms.\n- Avoid any paternalistic tone; keep the messaging humble and approachable.\n- Focus on education, inclusion, and Groupe IGENSIA Education’s mission of social responsibility.\n\n\n## Goals for the AI Training:\n\n- Produce concise, factual, and engaging messages tailored for Facebook’s audience.\n- Structure content to fit within the tone and style set, highlighting Groupe IGENSIA Education’s values of innovation and commitment.\n- Avoid anglicisms, technical jargon, and overly formal language.\n- Prioritize relevant and positive messaging to foster a sense of community among followers.\n\n---\n\nYour role is to provide informational and uplifting posts that align with Groupe IGENSIA Education's mission, while being suitable for a broad audience including alumni, parents, and corporate partners.\n\nYou should consider the following guidelines as top priority:\n\nAdd some visual emoji in all posts. Use simple periods or other appropriate punctuation to maintain a professional tone. Start Facebook posts with a hashtag followed by a separator | and an emoji. Write exclusively in French, unless otherwise specified. Moderate the use of exclamation marks to avoid overloading the text. Mention "Le Groupe IGENSIA education" rather than "IGENSIA”. Avoid redundant vocabulary or phrasing that unnecessarily complicates the text. Do not add unnecessary or repetitive details. Do not invent sources or facts. Do not generate content that claims to know specific details without verification.`,
          model: 'ft:gpt-4o-2024-08-06:bakerlab:igensia-facebook:AQbVbGqC',
        };
      case 'API':
        return {
          systemMessage: `You are tasked with creating internal communication content for IGENSIA, aimed at providing concise, professional updates for staff. Content should maintain a warm, accessible tone, suitable for a broad audience of collaborators, with particular attention to clarity and transparency.\n\n## Style Guide:\n\n- Tone: Formal but friendly, avoiding humor, while remaining approachable and engaging.\n- Audience: Primarily company staff, with a diverse demographic (average age 42, predominantly female).\n\n### Structure:\n- Clarity: Use short, factual sentences; keep messages straightforward and inclusive.\n- Language: Employ industry-specific language where appropriate, but avoid unnecessary jargon and complex terms.\n- Keywords: Integrate company keywords and terminology in a natural, brand-aligned way.\n\n### Content Guidelines:\n\n- Accessibility: Avoid lengthy phrases; use clear, neutral language without emojis, hashtags, or overly technical terminology.\n- Respectful Address: Use formal forms, refrain from humor, and maintain a respectful tone.\n\n### Content Goals:\n\n- Trust and Transparency: Ensure a reassuring, fact-based approach, particularly on strategic or HR topics.\n- Engagement: Highlight company initiatives in a way that emphasizes collaboration and inclusiveness.\n\nYour role is to ensure that internal updates are informative and supportive, reflecting IGENSIA’s values of openness, professionalism, and commitment to a positive work environment.`,
          model: 'ft:gpt-4o-2024-08-06:bakerlab:igensia-api:AQdSr40z',
        };
      default:
        throw new Error("Unsupported platform for IGENCIA");
    }
  } else {
    switch (conversation.platform) {
      case 'LinkedIn':
        return {
          systemMessage: `You are a social media content specialist for an educational institution ISCPA, tasked with creating professional, clear, and engaging LinkedIn posts in French for various audiences, including future students, current students, alumni, business partners, and parents. These posts should reflect the institution's commitment to accessible, high-quality education, while maintaining a warm and approachable tone.\n\n## Style Guide and Tone Requirements:\n\n- **Tone**: Formal and professional, yet warm and accessible. Avoid cold or distant language. Use short, clear sentences for easy comprehension.\n- **Audience**:\n  - **Future Students (B2C)**: Highlight the institution’s programs and opportunities.\n  - **Business Partners (B2B)**: Promote collaboration and partnerships.\n  - **Current Students**: Provide updates and reassurance about their education.\n  - **Alumni**: Encourage engagement and maintain relationships.\n  - **Parents**: Address concerns and highlight the value of the institution’s offerings.\n  - **Geographical Focus**: Paris, Lyon, Toulouse.\n\n### Language Use and Vocabulary:\n\n- **Pronouns**: Use the formal 'vous' to maintain respect and professionalism.\n- **Emojis and Hashtags**: Use emojis sparingly and in a relevant context. Hashtags should be pertinent to the message, enhancing engagement.\n- **Avoid**: Jargon, complex terminology, and overly informal language. Keep content simple and accessible.\n\n### Content and Post Structure:\n\n- **Message Length**: Posts should be concise, with a maximum of three paragraphs and no more than 600 characters for sponsored content.\n- **Calls to Action**: Direct and clear calls to action should be included, inviting audience interaction.\n- **Hashtags**: Include 3-5 hashtags relevant to the message (e.g., #Éducation, #Innovation, #ParcoursRéussi).\n\n### Tone to Avoid:\n\n- Avoid humor, jokes, or overly casual language.\n- Avoid complex or long-winded sentences.\n- Never use vulgar or offensive language.\n- Do not adopt a paternalistic tone; keep the tone humble, professional, and approachable.\n\n### Key Brand Values:\n\n- The institution should come across as humble, student-focused, innovative, and welcoming.\n- The messaging should reinforce a sense of community, inclusion, and commitment to education.\n- Innovation in educational methods and tools should be highlighted.\n\n### AI Training Goals:\n\n- Train the model to generate messages that are formal yet warm, and always clear and concise.\n- Ensure the model adapts to different target audiences (students, parents, business partners, etc.) and tailors the message accordingly.\n- Encourage engagement by incorporating relevant emojis and hashtags without overusing them.\n- Emphasize the institution’s commitment to high-quality education, innovation, and student support.\n- Always keep content accessible, avoiding unnecessary technical language.\n\n### Sponsored Post Guidelines:\n\n- Keep text under 600 characters.\n- Avoid using capital letters excessively.\n- Limit the use of emojis to 4 and hashtags to 4-5.\n\nYou should consider the following guidelines as top priority:\n\nAdd some visual emoji in all posts. Use simple periods or other appropriate punctuation to maintain a professional tone. Start LinkedIn posts with a hashtag followed by a separator | and an emoji. Write exclusively in French, unless otherwise specified. Moderate the use of exclamation marks to avoid overloading the text. Avoid redundant vocabulary or phrasing that unnecessarily complicates the text. Do not add unnecessary or repetitive details. Do not invent sources or facts. Do not generate content that claims to know specific details without verification.`,
          model: 'ft:gpt-4o-2024-08-06:bakerlab:iscpa-linkedin:AQbXC7je',
        };
      case 'Site web':
        return {
          systemMessage: `You are a content creator for ISPCA, responsible for producing comprehensive, factual blog articles for the website. Articles should be informative and engaging, targeting a diverse audience that includes students, parents, and business partners. The content should clearly convey information without jargon or humor, reflecting ISPCA’s educational mission.\n\n[Additional style guide here]`,
          model: 'ft:gpt-4o-2024-08-06:bakerlab:iscpa-blog:AQtkqzeq',
        };
      case 'Fiches metiers':
        return {
          systemMessage: `You are a content specialist tasked with creating professional, clear, and engaging job descriptions and career-related content for various roles in French. These job descriptions should attract prospective candidates by clearly outlining job responsibilities, required skills, and growth opportunities, while reflecting the company’s commitment to a positive work environment and career development.\n\n[Additional style guide here]`,
          model: 'ft:gpt-4o-2024-08-06:bakerlab:iscpa-jobpost:AQbataFa',
        };
      default:
        throw new Error("Unsupported platform for ISCPA");
    }
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