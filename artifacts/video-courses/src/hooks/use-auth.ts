import { useState, useEffect } from "react";
import { 
  useGetMe, 
  useLogout, 
  User, 
  customFetch 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, refetch } = useGetMe({
    query: {
      retry: false,
      staleTime: Infinity,
    }
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        localStorage.removeItem("auth_token");
        queryClient.clear();
        window.location.href = "/";
      }
    }
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    logout: logoutMutation.mutate,
    refetch,
  };
}
