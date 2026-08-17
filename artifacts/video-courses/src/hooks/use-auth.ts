import { 
  useGetMe, 
  useLogout, 
  type User, 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, refetch } = useGetMe({
    query: {
      retry: false,
      staleTime: Infinity,
    } as any,
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("admin_token");
        localStorage.removeItem("applied_promocode");
        queryClient.clear();
        window.location.href = "/";
      },
    },
  });

  return {
    user: user as User | undefined,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    logout: logoutMutation.mutate,
    refetch,
  };
}

