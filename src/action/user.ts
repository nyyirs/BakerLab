"use server";
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { signIn } from "@/lib/auth";
import { CredentialsSignin } from "next-auth"
import { revalidatePath } from "next/cache";

export async function login (formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
  
    try {
      await signIn("credentials", {
        redirect: false,
        callbackUrl: "/main",
        email,
        password,
      });
  
    } catch (error) {
      const someError = error as CredentialsSignin;
      return someError.cause?.err?.toString();
    };
    redirect("/main");
  }

export async function register(formData: FormData) {
    const email = formData.get('email') as string; 
    const password = formData.get('password') as string; 
    const role = formData.get('role-option') as 'USER' | 'ADMIN';

    if (!email || !password){
        throw new Error('Please fill all fields');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: {
            email: email
        }
    });

    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    const hashedPassword = await hash(password, 12);
    // Create new user
    const newUser = await prisma.user.create({
        data: {
            email,
            role,
            password: hashedPassword,
        },
    });

    if (!newUser) {
        throw new Error('Failed to create user');
    }

    redirect('/login');
}

export async function createUser(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role-option') as 'ADMIN' | 'USER';
    const isAdmin = formData.get('is-admin') === 'true';

    if (!email || !password){
        throw new Error('Please fill all fields');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: {
            email: email
        }
    });

    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    const hashedPassword = await hash(password, 12);
    // Create new user
    const newUser = await prisma.user.create({
        data: {
            email,
            role,
            password: hashedPassword,
            isAdmin,
        },
    });

    if (!newUser) {
        throw new Error('Failed to create user');
    }
}


export async function getUsers() {
    const users = await prisma.user.findMany({
        orderBy: {id: 'desc'}
    });
    return users;
}

export async function deleteUser(userId: string) {
    await prisma.user.delete({
        where: { id: userId },
    })

    revalidatePath('/settings')
}