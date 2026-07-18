import { verifySession } from "@/lib/auth-helpers";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import PageTransition from "@/components/PageTransition";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforces authorization and fetches current user details
  const user = await verifySession();

  return (
    <ToastProvider>
      <div className="flex flex-col lg:flex-row h-[100dvh] fixed inset-0 w-screen overflow-hidden bg-[#F7F7F8] font-sans antialiased text-[#111113]">
        {/* Shared navigation sidebar */}
        <Sidebar user={user} />

        {/* Main operational panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </ToastProvider>
  );
}

