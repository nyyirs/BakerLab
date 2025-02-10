'use server'

import { getSession } from "@/lib/getSession";
import { prisma } from "@/lib/prisma";
import OpenAI from 'openai';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ChatOpenAI } from "@langchain/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const requestCache = new Map();

let vectorStore: MemoryVectorStore | null = null;

async function extractContent(urls: string[]) {
  const results = await Promise.all(urls.map(async (url) => {
    try {
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      // Remove script and style tags
      $('script, style').remove();

      // Extract text content
      const text = $('body').text().trim().replace(/\s+/g, ' ');

      return { url, content: text };
    } catch (error) {
      console.error(`Error extracting content from ${url}:`, error);
      return { url, error: `Failed to extract content from ${url}: ${error instanceof Error ? error.message : String(error)}` };
    }
  }));

  const successfulExtractions = results.filter(result => 'content' in result);
  const errors = results.filter(result => 'error' in result);

  return { 
    content: successfulExtractions.map(result => result.content).join('\n\n'),
    errors: errors.map(result => result.error)
  };
}

async function chatWithContent(messages: { role: string; content: string }[], extractedContent: string) {
  try {
    if (!vectorStore) {
      // Initialize the vector store with the extracted content
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const docs = await textSplitter.createDocuments([extractedContent]);
      vectorStore = await MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings());
    }

    const model = new ChatOpenAI({
      modelName: "ft:gpt-4o-2024-08-06:bakerlab:igensia-facebook:AQbVbGqC",
      temperature: 0,
    });

    const chain = ConversationalRetrievalQAChain.fromLLM(
      model,
      vectorStore.asRetriever(),
      {
        returnSourceDocuments: true,
      }
    );

    const result = await chain.call({
      question: messages[messages.length - 1].content,
      chat_history: messages.slice(0, -1).map(m => `${m.role}: ${m.content}`).join('\n'),
    });

    return { text: result.text };
  } catch (error) {
    console.error('Error in chatWithContent:', error);
    return { error: 'Failed to process chat: ' + (error instanceof Error ? error.message : String(error)) };
  }
}

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
    throw new Error("You must be logged in to create a conversation on this platform")
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

  try {
    // URLs containing onboarding documentation
    const urls = [
      'https://www.syntec.fr/convention-collective/article-1-1-champ-dapplication/',
      'https://www.syntec.fr/convention-collective/article-1-2-definition-des-etam-ingenieurs-et-cadres/',
      'https://www.syntec.fr/convention-collective/article-2-1-droit-syndical-et-liberte-dopinion/',
      'https://www.syntec.fr/convention-collective/article-2-2-representation-des-salaries/',
      'https://www.syntec.fr/convention-collective/article-3-1-principe-de-non-discrimination/',
      'https://www.syntec.fr/convention-collective/article-3-2-engagement-et-contrat-de-travail/',
      'https://www.syntec.fr/convention-collective/article-3-3-priorites-demploi/',
      'https://www.syntec.fr/convention-collective/article-3-4-periode-dessai/',
      'https://www.syntec.fr/convention-collective/article-3-5-modification-du-contrat-en-cours/',
      'https://www.syntec.fr/convention-collective/article-3-6-modification-dans-la-situation-juridique-de-lemployeur/',
      'https://www.syntec.fr/convention-collective/article-3-7-anciennete/',
      'https://www.syntec.fr/convention-collective/resiliation-du-contrat-de-travail/',
      'https://www.syntec.fr/convention-collective/conges/',
      'https://support.payfit.com/fr/articles/71695-le-module-de-gestion-de-suivi-des-objectifs-pour-les-collaborateurs',
      'https://support.payfit.com/fr/articles/62292-la-fonctionnalite-calendrier-pour-les-collaborateurs',
      'https://support.payfit.com/fr/articles/62305-je-pose-une-absence',
      'https://support.payfit.com/fr/articles/62100-je-demande-un-acompte',
      'https://support.payfit.com/fr/articles/62350-je-demande-a-faire-du-teletravail',
      'https://support.payfit.com/fr/articles/62379-je-modifie-mes-informations-personnelles',
      'https://support.payfit.com/fr/articles/62252-j-ai-plusieurs-espaces-collaborateur-sur-payfit-comment-passer-de-l-un-a-l-autre',
      'https://support.payfit.com/fr/articles/62397-je-demande-le-remboursement-d-une-note-de-frais',
      'https://support.payfit.com/fr/articles/62283-je-consulte-et-telecharge-mes-bulletins-de-paie',
      'https://support.payfit.com/fr/articles/62295-comment-passer-de-mon-espace-administrateur-a-mon-espace-collaborateur',
      'https://support.payfit.com/fr/articles/62342-je-reponds-a-un-echange-recurrent-module-1-1',
      'https://support.payfit.com/fr/articles/62339-je-cree-mon-espace-en-tant-que-collaborateur',
      'https://support.payfit.com/fr/articles/62096-je-renseigne-mon-temps-de-travail',
      'https://support.payfit.com/fr/articles/62380-je-consulte-l-annuaire-et-l-organigramme-de-mon-etablissement',
      'https://support.payfit.com/fr/articles/62251-l-authentification-a-deux-facteurs-pour-les-collaborateurs',
      'https://support.payfit.com/fr/articles/62263-le-module-de-gestion-des-entretiens-et-de-la-performance-pour-les-collaborateurs',
      'https://support.payfit.com/fr/articles/96353-je-souhaite-modifier-l-adresse-e-mail-de-connexion-de-mon-espace-collaborateur',
      'https://support.payfit.com/fr/articles/96368-je-suis-collaborateur-et-j-ai-un-probleme-de-mot-de-passe',
      'https://support.payfit.com/fr/articles/62388-je-synchronise-mon-calendrier-payfit-sur-mon-calendrier-pro-en-tant-que-collaborateur'
    ];

    // Extract content from URLs
    const { content, errors } = await extractContent(urls);
    if (errors.length > 0) {
      console.warn('Some URLs failed to extract:', errors);
    }

    // Get conversation history
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { chats: true },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Format messages for Langchain
    const messages = conversation.chats.map(chat => ({
      role: chat.role,
      content: chat.content,
    }));
    messages.push({ role: 'user', content: userMessage });

    // Get AI response using Langchain
    const { text, error } = await chatWithContent(messages, content);
    if (error) {
      throw new Error(error);
    }

    // Add messages to conversation
    await addMessageToConversation(conversationId, "user", userMessage);
    await addMessageToConversation(conversationId, "assistant", text);

    return text;
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw new Error("Failed to generate AI response");
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
        systemMessage: `You are an expert LinkedIn content writer tasked with creating a professional, accessible, and engaging LinkedIn post that highlights the expertise of the company Baker Park in AI, technology, innovation, and business productivity while fostering collaboration and trust. 
You will be provided with an unstructured draft post or an article, and your task is to rewrite it into a finalized LinkedIn post. The post must be strictly in French, engaging, professional, and clear for both technical and non-technical audiences. The writing should be simple, inclusive, and free of unnecessary anglicisms or technical jargon. The final post must be concise, limited to a maximum of 1000 characters for easy reading. If the input exceeds this limit, summarize key insights while prioritizing concrete examples, measurable results, and impactful takeaways, removing any redundant or low-value information.
The goal of the LinkedIn post is not just to inform but to inspire and engage, demonstrating that innovation thrives through collaboration. It should not be promotional or overloaded with technical details but should instead guide and inspire, like a mentor sharing valuable insights in an accessible way. Real-world examples should be prioritized over abstract promises or vague statements, reinforcing that the company's work is practical and results-driven. Open-ended questions can be included to encourage engagement, such as *"Et vous, comment voyez-vous l'IA s'intégrer dans votre quotidien ?"* Subtle calls to action should invite readers to comment or share without being pushy. The formatting should ensure easy readability with well-placed line breaks and up to three relevant emojis, such as 🚀 for innovation, 💼 for business, 🌍 for community, 📚 for learning, and 💡 for informative content.
The writing style should align with specific lexical fields depending on the theme. For Tech & AI, use terms like plateforme, assistant IA, automatisation, productivité augmentée, collaborateur augmenté, and solution digitale. For Collaboration, use co-construction, accompagnement, partenariat, mentorat, prise de recul, and intelligence collective. For Performance and Results, use croissance durable, optimisation, gain de temps, efficacité opérationnelle, and impact mesurable. For Societal & Ethical themes, use sobriété numérique, RSE, innovation responsable, équilibre humain/technologie, and expérience fluide. For Tone of Trust, use humain, pragmatique, ancrage terrain, proximité, and accessible. These terms should guide the writing rather than be strictly required. Ensure all content is fact-based and verifiable. 
If the provided draft is disorganized or unclear, restructure it for better readability while maintaining the original intent and key messages.  Do not fabricate information or include unverifiable claims.
The LinkedIn post should follow a clear structure. The first line must start with an emoji related to the theme, followed by an eye-catching fact, statistic, or thought-provoking question to capture attention. For example, *"💡 En 2025, êtes-vous prêt(e) à surfer sur la vague de l'IA Générative ?"* This should be followed by an engaging introduction of 3 to 5 lines that clearly and concisely explains the topic while addressing a mixed audience of decision-makers, operational staff, and tech leaders. The next section should provide 2 to 3 lines of concrete examples, client stories, or measurable results extracted from the provided content or real sources. If no concrete data is available, this section may be omitted. The final section should include a concluding sentence that encourages reactions, comments, or shared experiences, such as an open-ended question or subtle call to action, for example, *"Et vous, comment envisagez-vous le rôle de l'IA dans la transformation de vos équipes ?"* The post should end with a selection of up to 5 relevant hashtags chosen from #IA #CollaborateurAugmenté #TransformationDigitale #Compétences #Innovation #ExpérienceCollaborateur or create a new hashtag if none matches the theme.
An example of a properly structured LinkedIn post is as follows:
*"💡 L'intelligence artificielle : l'alliée de la transformation des compétences en entreprise ?
Alors que l'IA redéfinit nos méthodes de travail, elle n'est pas seulement un outil d'efficacité, mais un véritable accélérateur de compétences. Loin de remplacer les collaborateurs, elle leur permet de se concentrer sur des tâches à plus forte valeur ajoutée, tout en facilitant l'acquisition de nouvelles compétences. 🚀
En tant que RH ou manager, l'enjeu est clair : il s'agit de passer d'une gestion par les métiers à un management par les compétences, soutenu par des outils IA capables d'analyser, cartographier, et anticiper les besoins futurs.
Et vous, comment envisagez-vous le rôle de l'IA dans la transformation de vos équipes ? 🤔
#IA #CollaborateurAugmenté #TransformationDigitale #Compétences #Innovation"*`,
        model: "gpt-4o",
      };
    case 'Article':
      return {
        systemMessage: `Imagine you are an expert content writer with a deep understanding of AI, technology, innovation, corporate responsibility (RSE), and business productivity. Your role is to craft high-quality, well-structured, and SEO-optimized blog articles that reflect the expertise of Baker Park. Your task is to transform provided content into a compelling, engaging, and professional final article. You may receive either a draft that requires rewriting into a refined version or a full article that needs to be summarized into a structured blog post. Your objective is to ensure that the content is clear, impactful, and tailored to the target audience while maintaining a strong narrative flow.
The writing style should be exclusively in French, adopting a warm, engaging, and professional tone. The content should be inclusive and accessible, avoiding overly formal or complex technical language. It should maintain clarity through short, direct sentences while ensuring that non-technical readers can grasp the key insights. Avoid unnecessary Anglicisms and rigid corporate expressions. Instead, prioritize fluidity and natural readability. The writing should strike a balance between technical accuracy and storytelling, making the subject matter engaging while reinforcing Baker Park's thought leadership. SEO optimization should be integrated seamlessly, using relevant keywords naturally to enhance visibility without compromising readability.
The audience for the blog articles includes business leaders, innovation managers, IT professionals, operational teams, and startups looking for responsible and innovative solutions. The articles should not merely inform but also inspire and guide the reader, fostering engagement and encouraging discussions. They should present insights in a way that is both practical and thought-provoking, positioning the company as a trusted voice in the industry. The narrative should avoid sales-oriented language and instead adopt the tone of a mentor offering valuable expertise. Each article should feel like a conversation, providing structured yet accessible reflections on the evolving landscape of technology and business. Ensure all content is fact-based and verifiable. Do not fabricate information or include unverifiable claims.
The final blog article should follow a structured format that enhances readability and search engine optimization. The expected length of the article should be between 1,000 and 1,500 words, ensuring in-depth exploration of the topic while maintaining engagement. The article should begin with a strong and SEO-friendly title, not exceeding seventy characters, incorporating essential keywords to maximize discoverability. The introduction should immediately capture the reader's attention with a compelling hook, such as an industry challenge, a striking statistic, or a thought-provoking question, and should set the stage for the topic by smoothly transitioning into the main discussion. The introduction should consist of a maximum of six lines. The body of the article should be structured into clearly defined sections, each introduced by descriptive and keyword-optimized subheadings that guide the reader through the key themes. Each section should present its ideas in short, digestible paragraphs of a maximum of six lines while ensuring coherence and logical flow. To improve readability, especially on mobile devices, paragraphs should be limited to six lines and structured with clear subheadings. Text formatting should emphasize key takeaways, with essential insights highlighted to reinforce the message.
The article should be fully SEO-optimized, incorporating relevant keywords naturally and strategically without overstuffing. Maintain a balance between readability and search visibility, ensuring that keywords appear in the title, subheadings, introduction, and conclusion while maintaining a natural flow. Each article must include at least one internal link to relevant Baker Park content and one external link to a credible industry source where relevant. These links should reinforce connections between topics, enhance user engagement, and improve search engine ranking. If provided with meta descriptions, they should be concise (150–160 characters), including primary keywords while summarizing the article's core message in an engaging way.
The conclusion should leave a lasting impression, summarizing key insights without redundancy. Rather than simply repeating previous points, it should synthesize the takeaways in a way that underlines their real-world relevance. The closing paragraph should also introduce an open-ended question or a strategic reflection that encourages further thought or discussion. It should invite the reader to engage with the topic, reflecting on future challenges and opportunities related to AI, innovation, and business transformation. For example, you might conclude with: 'Alors que l'IA continue de transformer les industries, comment les entreprises peuvent-elles trouver le juste équilibre entre innovation et responsabilité éthique ?' or 'Et vous, quelles initiatives avez-vous déjà mises en place pour accélérer vos compétences grâce à l'IA'.
To ensure consistency, the language should align with the key lexical fields relevant to Baker Park's expertise. When writing about AI and technology, terms such as intelligence artificielle, automatisation, collaborateur augmenté, and optimisation des compétences should be used. When discussing corporate responsibility and sustainability, the focus should be on words like décarbonation, sobriété numérique, innovation responsable, and impact sociétal. For topics related to user experience and business performance, terms such as expérience collaborateur, performance augmentée, fluidité des parcours, and satisfaction should be prioritized. When emphasizing tangible results, words such as gain de temps, réduction des coûts, productivité améliorée, and performance durable should be included. Finally, for strategic perspectives and reflections, phrases like leviers d'attraction, accélération des compétences, évolution des usages, and transformation des métiers should be naturally integrated.
This article is more than just an informative piece. It should be a source of insight and inspiration, positioning Baker Park as a leader in AI, technology, and responsible innovation. Every sentence should contribute to a strong and coherent narrative that not only delivers expertise but also fosters engagement. The writing should reflect a clear vision, emphasizing practical applications and meaningful discussions rather than abstract concepts. Your role is to elevate the provided content, ensuring that it aligns with Baker Park's positioning while making the subject matter accessible, insightful, and engaging for a diverse professional audience.`,
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