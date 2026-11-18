import { AuthGate } from "@/components/auth/AuthGate";
import { TabBar } from "@/components/layout/TabBar";

/** App screens: fixed-height column, content scrolls between the header and the tab bar. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col">
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <AuthGate>{children}</AuthGate>
      </main>
      <TabBar />
    </div>
  );
}
