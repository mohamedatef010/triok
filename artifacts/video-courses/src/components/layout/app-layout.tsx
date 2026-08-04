import { Navbar } from "./navbar";
import { Footer } from "./footer";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col relative bg-background font-sans text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      <main className="flex-1 w-full flex flex-col relative">
        {children}
      </main>
      <Footer />
    </div>
  );
}
