import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Router as WouterRouter } from 'wouter';
import { AppRouter } from './app-router';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

// Attach auth tokens via the api-client fetch helper (preserves Content-Type headers)
import { setAuthTokenGetter } from "@workspace/api-client-react";

setAuthTokenGetter(() => {
  const onAdminPages = window.location.pathname.startsWith("/admm");
  if (onAdminPages) {
    return localStorage.getItem("admin_token") ?? localStorage.getItem("auth_token");
  }
  return localStorage.getItem("auth_token");
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: 30000, // Background polling every 30 seconds
      staleTime: 5000,
    },
  },
});


/** Inner component so hooks can access the React tree */
function AppInner() {
  useScrollReveal();
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AppRouter />
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppInner />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
