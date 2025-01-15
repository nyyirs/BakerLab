import ModelCard from '@/components/ModelCard';
import { getSession } from "@/lib/getSession";
import { redirect } from "next/navigation";

const page = async () => {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    redirect("/login");
  }

  return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <div className="col-span-full">
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold">Choisir mon modèle</h1>
                  <p className="text-muted-foreground">Sélectionnez le modèle correspondant à votre besoin.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
                  <ModelCard />
                </div>
              </div>
          </div>
      </div>
  )}

export default page