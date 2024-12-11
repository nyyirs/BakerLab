'use client'

import { useState, useTransition } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { login } from '@/action/user'

const LoginPage = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      const result = await login(formData);
      setErrorMessage(result?.toString() || "");
    });
  };  
  
  return (
    <div className="w-full max-w-md space-y-10 text-white">
      <p className="text-lg text-primary-foreground text-center mb-8">Entrez vos identifiants pour vous connecter au Hub</p> 
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Votre email</Label>
          <Input id="email" type="email" name="email" placeholder="m@example.com" required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Votre mot de passe</Label>
          <Input id="password" type="password" name="password" required />
        </div>

        {errorMessage && (
          <div className="text-red-500 text-sm">
            {errorMessage}
          </div>
        )}
        
        <Button type="submit" className="w-full bg-BakerLabButton" disabled={isPending}>
          {isPending ? 'Chargement...' : 'Login'}
        </Button>
      </form>
    </div>
  )
}
export default LoginPage