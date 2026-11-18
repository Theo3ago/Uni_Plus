import { AuthGate } from "@/components/auth/AuthGate";
import { TabBar } from "@/components/layout/TabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="flex flex-1 flex-col">
        <AuthGate>{children}</AuthGate>
      </main>
      <TabBar />
    </>
  );
}
