import MainCard from '@/components/MainCard';
import RecentChatTable from '@/components/RecentChatTable';
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
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3">
                  <MainCard userData={user.email ?? ''}/>
              </div>
          </div>

          <div className="col-span-full">
              <RecentChatTable/>
          </div>
      </div>
  )}

export default page