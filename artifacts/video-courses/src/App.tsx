import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Router as WouterRouter } from 'wouter';
import { AppRouter } from './app-router';

// Add custom fetch interceptor for auth
import { customFetch } from "@workspace/api-client-react";

const originalFetch = window.fetch;
window.fetch = async (input, init = {}) => {
  const isApi = typeof input === "string" && input.startsWith("/api");
  if (isApi) {
    // Check if it's admin route vs normal user route to pick token?
    // Actually we will handle both auth_token and admin_token logic if needed,
    // but the system mostly uses single token for simplicity, or we can just send auth_token.
    // For admin, we store `admin_token`.
    let token = localStorage.getItem("auth_token");
    if (input.includes("/admm") || (window.location.pathname.startsWith("/admm") && !input.includes("/auth/me"))) {
      token = localStorage.getItem("admin_token") || token;
    }

    if (token) {
      init.headers = {
        ...init.headers,
        Authorization: `Bearer ${token}`
      };
    }
  }
  return originalFetch(input, init);
};

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AppRouter />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
