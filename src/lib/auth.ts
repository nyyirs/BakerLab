import NextAuth, { DefaultSession, CredentialsSignin } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"

declare module "next-auth" {
  interface User {
    role?: any;
  }
  interface Session{
    user: User
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: {label: "Email", type: "email"},
        password: {label: "Password", type: "password"}
      },

      authorize: async (credentials) => {
        const email = credentials.email as string | undefined;
        const password = credentials.password as string | undefined;

        if (!email || !password){
          throw new Error('Please provide both email and password')
        };

        const user = await prisma.user.findUnique({
          where: {
            email: email
          }
        })

        if (!user || !password){
          throw new Error("Invalid email or password")
        }

        const isMatched = await compare(password, user.password!)

        if(!isMatched){
          throw new Error("Wrong password")
        }
        const userData = {
          email: user.email,
          role: user.role,
          id: user.id
        }
        return userData
      }     
      
    })
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async session({ session, token }) {
      if (token?.sub && token?.role) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
  }
})