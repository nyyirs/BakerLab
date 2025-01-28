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

export async function generateVideoAIResponse(conversationId: string, userMessage: string) {
  const session = await getSession()
  if (!session?.user?.email) {
    throw new Error("You must be logged in to generate an AI response")
  }

    const fakeResponse =
    'Voici la vidéo générée avec l\'avatar de Léa pour votre fiche de poste "Alternance - BTS Marketing Digital"'

  try {
    await addMessageToConversation(conversationId, "user", userMessage)
    await addMessageToConversation(conversationId, "assistant", fakeResponse)

    return fakeResponse
  } catch (error) {
    console.error("Error generating fake AI response:", error)
    throw new Error("Failed to generate fake AI response")
  }
}

export async function generateCVAIResponse(conversationId: string, userMessage: string) {
  const session = await getSession()
  if (!session?.user?.email) {
    throw new Error("You must be logged in to generate an AI response")
  }

  const fakeResponse = "Profil 1 : Agathe, Responsable Communication avec expérience internationale et gestion de crises\nRésumé :\nExpérience : 7 ans dans la communication, avec une expérience internationale dans une entreprise du secteur technologique. A travaillé dans des environnements multiculturels et a géré des équipes en remote.\nForces :\nGestion de crises réussie : Expérience dans la gestion de crises médiatiques à l'échelle internationale, avec des résultats positifs (réduction des impacts négatifs de 30% lors d'une crise de réputation).\nCommunication internationale : Expertise dans la création de stratégies de communication adaptées à des publics multiculturels, avec une approche localisée selon les marchés.\nLeadership et management d'équipe : A supervisé une équipe de 5 personnes dans la création de contenu et la gestion des campagnes, en utilisant des outils collaboratifs et en mettant en place des formations internes.\nFaiblesses :\nManque de spécialisation dans le secteur B2C : Principalement orienté vers des projets B2B, manque d'expérience directe en communication B2C, ce qui pourrait être un frein dans des contextes de marketing de masse.\nMoins d'expérience avec les petites entreprises ou startups : L'expérience principale est dans des grandes entreprises, et elle pourrait manquer de flexibilité pour travailler dans un environnement startup avec des ressources limitées.\nCompétences en SEO de base : Bien qu'elle utilise Google Analytics, ses compétences en SEO sont encore en développement, ce qui peut être un point faible pour des campagnes de visibilité en ligne.\n\nProfil 2 : Pierre, Responsable Communication digitale et création de contenu\nRésumé :\nExpérience : 5 ans dans des entreprises de marketing digital et de création de contenu, avec une expérience solide en gestion des réseaux sociaux et des campagnes digitales. A travaillé en étroite collaboration avec des influenceurs et des créateurs de contenu.\nForces :\nExpertise en réseaux sociaux et marketing digital : Spécialisé dans la gestion des communautés, l'analyse de performance et la création de contenu viral sur des plateformes comme Instagram, LinkedIn et TikTok.\nCréation de contenu visuel et multimédia : Forte expérience dans la production de visuels, vidéos et autres formats multimédia en utilisant des outils comme Adobe Creative Suite et Canva.\nAdaptabilité aux tendances et à l'innovation : Toujours à l'affût des nouvelles tendances et capable d'intégrer des technologies innovantes, comme l'utilisation de l'IA pour la création de contenu.\nFaiblesses :\nMoins d'expérience en gestion de crises : Bien que très compétent dans la gestion de communautés et de campagnes positives, il n'a pas été exposé à de grandes crises de communication.\nGestion de projets complexe moins développée : Son rôle a surtout été centré sur la création de contenu, et il manque de leadership dans la gestion de projets à grande échelle.\nManque de compétences en communication interne : A tendance à se concentrer sur la communication externe et pourrait être moins à l'aise dans la gestion de la communication interne, en particulier dans une grande entreprise.\n\nProfil 3 : Léa, Responsable Communication stratégique et relations presse\nRésumé :\nExpérience : 10 ans dans la communication stratégique et les relations presse, avec des responsabilités de haut niveau dans la gestion de l'image de marque d'entreprises du secteur de la santé et de l'innovation.\nForces :\nStratégie de communication à long terme : Expertise dans la définition de stratégies de communication sur le long terme, alignées avec les objectifs de l'entreprise et visant à construire une image solide et cohérente.\nExcellentes relations presse : Réseau établi de contacts dans les médias, avec des réussites notables dans la couverture de marque et des articles dans des publications de grande envergure.\nGestion de la réputation de la marque : A supervisé avec succès plusieurs initiatives visant à renforcer la réputation de l'entreprise et à maintenir une image positive auprès des parties prenantes externes et internes.\nFaiblesses :\nManque de compétences en communication digitale : Bien qu'elle ait une forte expérience en communication traditionnelle (presse, événements, relations publiques), elle est moins à l'aise avec les outils digitaux modernes, notamment en ce qui concerne la gestion des réseaux sociaux.\nMoins orientée vers la création de contenu multimédia : Peu de compétences dans la création de contenu visuel et multimédia, ce qui peut être un handicap dans une communication plus visuelle et dynamique.\nGestion de l'engagement des communautés en ligne : A moins d'expérience dans la gestion directe de communautés en ligne et d'interactions sur les plateformes numériques comme les réseaux sociaux ou les forums.\n\nRésumé des profils :\nAgathe est une leader avec une forte expertise en gestion de crise et une expérience internationale, mais elle doit encore développer ses compétences en SEO et s'adapter à des environnements de plus petite taille.\nPierre excelle dans la création de contenu et la gestion des réseaux sociaux, mais manque de leadership en gestion de projet complexe et d'expérience en communication interne.\nLéa est une experte stratégique en relations presse avec une longue expérience dans la gestion de l'image de marque, mais sa compétence limitée en communication digitale pourrait freiner son efficacité dans un monde de plus en plus tourné vers le digital."
  try {
    await addMessageToConversation(conversationId, "user", "Résultats de l'analyse du CV")
    await addMessageToConversation(conversationId, "assistant", fakeResponse)

    return fakeResponse
  } catch (error) {
    console.error("Error generating fake AI response:", error)
    throw new Error("Failed to generate fake AI response")
  }
}

export async function generateOnboardingAIResponse(conversationId: string, userMessage: string) {
  const session = await getSession()
  if (!session?.user?.email) {
    throw new Error("You must be logged in to generate an AI response")
  }

  let response = ''

  // Handle first message about vacation request
  if (userMessage.toLowerCase().includes('comment demander des congés')) {
    response = 'Bien sûr ! Chez nous, nous utilisons PayFit pour la gestion des congés et RTT. Voici comment demander un congé :\n' +
      '1. Connectez-vous à PayFit.\n' +
      '2. Une fois connecté, allez dans la section "Congés et absences".\n' +
      '3. Cliquez sur "Nouvelle demande".\n' +
      '4. Sélectionnez le type de congé (Congé payé, RTT, etc.).\n' +
      '5. Choisissez les dates souhaitées et ajoutez un commentaire si nécessaire.\n' +
      '6. Validez votre demande en cliquant sur "Soumettre".\n' +
      'Votre manager recevra une notification pour l\'approuver, et vous serez informé une fois que c\'est validé.\n' +
      'Avez-vous besoin d\'aide supplémentaire ?'
  }
  // Handle second message about RTT usage deadline
  else if (userMessage.toLowerCase().includes('combien de temps') && userMessage.toLowerCase().includes('rtt')) {
    response = 'Excellente question ! Les RTT doivent être utilisés avant la fin du mois de mars de l\'année suivante.\n' +
      '* Exemple : Les RTT acquis en 2024 devront être utilisés avant le 31 mars 2025.\n' +
      'Si vous avez encore des RTT restants, je vous conseille de planifier rapidement vos jours pour éviter de les perdre. Vous pouvez consulter votre solde sur PayFit dans la section "Congés et absences".\n' +
      'Besoin d\'aide pour une autre question ? 😊'
  }

  try {
    await addMessageToConversation(conversationId, "user", userMessage)
    await addMessageToConversation(conversationId, "assistant", response)

    return response
  } catch (error) {
    console.error("Error generating AI response:", error)
    throw new Error("Failed to generate AI response")
  }
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
      case 'Igensia':
        return {
          systemMessage: `You are an expert job post writer trained to create engaging, dynamic, and inclusive job advertisements that reflect the values and culture of the hiring company. You will be provided with an unstructured and draft job post and your task is to rewrite the finalised version of the job post that adheres to the following tome and writing style guidelines: You should write content in the french language. You should use a warm, engaging, and dynamic tone, avoiding overly formal or institutional language. You should keep the language simple, clear, and inclusive, enabling candidates to easily relate to the job and company culture.  You should avoid writing jargon and overly institutional or formal language.  The job post should be candidate-centric, emphasizing what the company offers in return for the candidate's contributions. The job post should be limited to a concise format of maximum 1500 characters for easy reading. You should not invent any content and your task is limited to only re-writing the provided content. You will be provided information such as the job title, presentation of the hiring company, details of the mission and other details You should rewrite the job post to the following structure: The first line should be the job title as header An introduction paragraph of around 55 words should follow. The introduction should be an engaging and dynamic paragraph summarising the job's key details such as the sector, location and company size. This introductory paragraph should be concise and helps candidates quickly understand if the opportunity matches their expectations. The next section should have as header "Présentation de l'entreprise" and a paragraph of around 90 words description of the hiring company.  The paragraph should offer an authentic glimpse into the company's culture, values, and work environment. The paragraph should maintain a warm and inclusive tone that reflects the company's accessibility and appeal. The next section should have as header "Mission". This section should should have a single line text maintaining the format of the following sample "En tant que Chargé(e) de Projet Marketing en Alternance, tu auras l'opportunité de:".   Around 4-6 consise and structured bullet points should present the main responsibilities of the role.  You should use action verbs and should avoid overly long lists to keep the role approachable for a wide range of candidates. The next section should have as header "Profil recherché". This section should have a captivating sentence followed by the text "Nous recherchons un(e) candidat(e) :". An example of such a sentence would be: "Chez Igensia, nous valorisons l'audace et l'envie de se dépasser. Nous recherchons un(e) candidat(e) :". This section should list around 4-6 structured bullet points the ideal candidate's qualities in an inclusive and motivating way. The bullet points should focus on human qualities and soft skills rather than overly specific technical competencies. The next section should have as header "Avantages et environnement de travail". This section should contain concise and structured bullet points that clearly mention financial and non-financial benefits, such as flexible working conditions, professional growth opportunities, or company perks. The bullet points should highlight elements that make the role and workplace appealing. The final section should include a concluding sentence that encourages the candidate to apply. You can inspire from the sample "Prêt(e) à vivre une expérience inoubliable ? Rejoins-nous chez Igensia et fais partie de notre aventure marketing. Postule dès maintenant pour laisser ton empreinte à Toulouse !"`,
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