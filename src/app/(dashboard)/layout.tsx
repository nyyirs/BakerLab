import LeftNav from "@/components/LeftNav";
import TopNav from "@/components/TopNav";
import { getSession } from "@/lib/getSession";
import { SessionProvider } from "next-auth/react";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const session = await getSession();
    const user = session?.user;

    return (
        <div className="h-screen flex">
            {/* LEFT */}
            <div className="w-16 md:w-56 bg-IGSBackground flex-shrink-0">
                <LeftNav />
            </div>

            {/* RIGHT */}
            <div className="flex-1 flex flex-col bg-muted/40 overflow-hidden py-4">
                <TopNav userRole={user?.role ?? ""} />
                <div className="flex-1 overflow-auto p-4">
                    <div className="max-w-[1600px] mx-auto w-full h-full">
                        <SessionProvider>   
                            {children}
                        </SessionProvider>
                    </div>
                </div>
            </div>
        </div>        
    );
}