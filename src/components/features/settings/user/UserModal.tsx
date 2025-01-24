'use client'

import { createUser } from "@/action/user";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface UserModalProps {
    open: boolean;
    setOpen: (isOpened: boolean) => void;
    isLoading: boolean;
    handleSubmit: () => void;
    onFinished?: () => void;
}

export function UserModal({
  open,
  setOpen,
}: UserModalProps) {
    const [selectedRole, setSelectedRole] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [passwordConfirmation, setPasswordConfirmation] = useState("")
    const [isAdmin, setIsAdmin] = useState(false)

    const handleSubmit = async () => {
        if (isLoading) return;
        setIsLoading(true);

        if (!email.trim() || !password.trim() || !passwordConfirmation.trim() || !selectedRole || password !== passwordConfirmation) {
            setIsLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('role-option', selectedRole);
        formData.append('is-admin', isAdmin.toString());

        try {
            await createUser(formData);
        } catch (error) {
            console.error("Error registering user:", error);
        } finally {
            setIsLoading(false);
            setOpen(false);
            window.location.reload();
        }
    }

    return <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="text-tertiary">Ajouter un utilisateur</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4 overflow-hidden">
                <div className="w-full px-1">
                    <div className="text-md mb-2 text-tertiary">Adresse email</div>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="w-full px-1">
                    <div className="text-md mb-2 text-tertiary">Mot de passe</div>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="w-full px-1">
                    <div className="text-md mb-2 text-tertiary">Confirmez le mot de passe</div>
                    <Input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} />
                </div>
                <div className="w-full px-1">
                    <div className="text-md mb-2 text-tertiary">Rôle</div>
                    <Select 
                        value={selectedRole} 
                        onValueChange={(value) => {
                            setSelectedRole(value);
                            setIsAdmin(value === 'ADMIN');
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez votre rôle"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='ADMIN'>Administrateur</SelectItem>
                            <SelectItem value='USER'>Utilisateur</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    className="bg-BakerLabButton mt-4"
                    disabled={isLoading}
                    onClick={handleSubmit}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Chargement...
                        </>
                    ) : (
                        'Soumettre'
                    )}
                </Button>
            </div>
        </DialogContent>
    </Dialog>
}