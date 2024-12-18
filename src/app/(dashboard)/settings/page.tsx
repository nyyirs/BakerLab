'use client'

import { UserModal } from "@/components/features/settings/user/UserModal";
import UserTable from "@/components/features/settings/user/UserTable";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card";
import { useState } from "react";


export default function UsersSettings() {
    const [openModal, setOpenModal] = useState(false)

    const triggerOpenModal = () => {
        setOpenModal(true)
    }

    return <div className="flex flex-col gap-2">
        <Card>
            <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                    Gestion des utilisateurs
                </CardDescription>
            </CardHeader>
            <CardFooter>
                <Button
                    className='bg-BakerLabButton rounded-[8px] hover:bg-BakerLabButton hover:opacity-80 transition-opacity duration-300'
                    onClick={triggerOpenModal}
                >
                    Ajouter un utilisateur
                </Button>
            </CardFooter>
        </Card>

        <UserTable/>

        <UserModal
            open={openModal}
            setOpen={setOpenModal}
            isLoading={false}
            handleSubmit={() => {}}
        />
    </div>
}
