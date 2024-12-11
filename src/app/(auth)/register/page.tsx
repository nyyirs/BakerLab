'use client'

import { useTransition } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { register } from "@/action/user"

const RegisterPage = () => {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
        const result = await register(formData);
    });
  };  

  return (
    <div className="w-full max-w-md space-y-10 text-white">
      <p className="text-lg text-primary-foreground text-center mb-8">Créez un compte pour accéder au Hub</p> 
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Votre email</Label>
          <Input id="email" type="email" name="email" placeholder="m@example.com" required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Votre mot de passe</Label>
          <Input id="password" type="password" name="password" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role-option">Rôle</Label>
          <Select name="role-option" defaultValue="USER">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionnez un rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">Utilisateur</SelectItem>
              <SelectItem value="ADMIN">Administrateur</SelectItem>
            </SelectContent>
          </Select>
        </div>        
        <Button type="submit" className="w-full bg-BakerLabButton" disabled={isPending}>
          {isPending ? 'Chargement...' : 'S\'inscrire'}
        </Button>
      </form>
    </div>
  )
}

export default RegisterPage

