import { useState, useEffect, useCallback, useRef } from "react";
import { 
  useGetCart, 
  useAddToCart, 
  useRemoveFromCart, 
  useClearCart,
  getGetCartQueryKey,
  CartItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

const CART_EVENT = "video_courses_cart_updated";

function getStoredLocalCart(): CartItem[] {
  try {
    const stored = localStorage.getItem("local_cart");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/** Returns true when the user has a valid customer auth token stored locally,
 *  even before useGetMe finishes its first fetch. */
function hasAuthToken(): boolean {
  return !!localStorage.getItem("auth_token");
}

export function useCart() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [localCart, setLocalCart] = useState<CartItem[]>(getStoredLocalCart);
  const isSyncing = useRef(false);

  // Enable server cart fetch when authenticated, or while auth is still loading and a token exists.
  const tokenPresent = isAuthenticated || (authLoading && hasAuthToken());

  const { data: serverCart, refetch } = useGetCart({
    query: {
      enabled: tokenPresent,
      staleTime: 5000,
    } as any,
  });

  const addToCartMut = useAddToCart();
  const removeFromCartMut = useRemoveFromCart();
  const clearCartMut = useClearCart();

  // Listen to cart events across all components & browser tabs
  useEffect(() => {
    const handleCartSync = () => {
      setLocalCart(getStoredLocalCart());
      if (isAuthenticated) {
        refetch();
      }
    };
    window.addEventListener(CART_EVENT, handleCartSync);
    window.addEventListener("storage", handleCartSync);
    return () => {
      window.removeEventListener(CART_EVENT, handleCartSync);
      window.removeEventListener("storage", handleCartSync);
    };
  }, [isAuthenticated, refetch]);

  const updateLocalCart = useCallback((newCart: CartItem[]) => {
    setLocalCart(newCart);
    localStorage.setItem("local_cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event(CART_EVENT));
  }, []);

  // Auto-sync guest cart items to the server when user logs in.
  // sessionStorage flag ensures this runs exactly once per login session.
  useEffect(() => {
    if (!isAuthenticated) {
      // Reset the sync flag on logout so next login re-syncs
      sessionStorage.removeItem("cart_guest_sync_done");
      return;
    }

    if (isSyncing.current) return;
    if (sessionStorage.getItem("cart_guest_sync_done")) return;

    const stored = getStoredLocalCart();
    if (stored.length === 0) {
      // No guest items — mark done and just refresh server cart
      sessionStorage.setItem("cart_guest_sync_done", "1");
      refetch();
      return;
    }

    // Mark immediately to prevent concurrent runs
    isSyncing.current = true;
    sessionStorage.setItem("cart_guest_sync_done", "1");

    // Clear local cart before async ops to avoid duplicate display
    localStorage.removeItem("local_cart");
    setLocalCart([]);

    const syncGuestItems = async () => {
      for (const item of stored) {
        if (!item?.videoId) continue;
        try {
          await addToCartMut.mutateAsync({ data: { videoId: item.videoId } });
        } catch {
          // Ignore conflicts (item may already be in server cart)
        }
      }
      await queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      await refetch();
      window.dispatchEvent(new Event(CART_EVENT));
      isSyncing.current = false;
    };

    syncGuestItems();
  // Only re-run when auth state changes — all other deps are stable refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const serverCartItems = Array.isArray(serverCart?.items) ? serverCart!.items : 
                          Array.isArray(serverCart) ? (serverCart as any) : [];
  // Use server cart strictly when authenticated (or initial loading with a customer token)
  const useServerCart = isAuthenticated || (authLoading && hasAuthToken());
  const items: CartItem[] = useServerCart ? serverCartItems : localCart;
  const total = useServerCart 
    ? (serverCart?.total || 0)
    : localCart.reduce((acc, item) => acc + (item.discountPrice ?? item.price), 0);

  const add = async (item: CartItem) => {
    if (isAuthenticated) {
      try {
        const res = await addToCartMut.mutateAsync({ data: { videoId: item.videoId } });
        if (res && Array.isArray(res.items)) {
          queryClient.setQueryData(getGetCartQueryKey(), res);
        }
      } catch (err: any) {
        console.error("Error adding to cart on server:", err);
        // Fallback: If server request fails (e.g. expired session), keep in localCart
        const current = getStoredLocalCart();
        if (!current.find(i => Number(i.videoId) === Number(item.videoId))) {
          updateLocalCart([...current, item]);
        }
      }
      await queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      await queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      await refetch();
      window.dispatchEvent(new Event(CART_EVENT));
    } else {
      const current = getStoredLocalCart();
      if (!current.find(i => Number(i.videoId) === Number(item.videoId))) {
        updateLocalCart([...current, item]);
      }
    }
  };

  const remove = async (videoId: number) => {
    if (isAuthenticated) {
      try {
        const res = await removeFromCartMut.mutateAsync({ videoId });
        if (res && Array.isArray(res.items)) {
          queryClient.setQueryData(getGetCartQueryKey(), res);
        }
      } catch (err) {
        console.error("Error removing from cart:", err);
      }
      await queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      await queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      await refetch();
      window.dispatchEvent(new Event(CART_EVENT));
    } else {
      const current = getStoredLocalCart();
      updateLocalCart(current.filter(i => Number(i.videoId) !== Number(videoId)));
    }
  };

  const clear = async () => {
    if (isAuthenticated) {
      try {
        await clearCartMut.mutateAsync();
        queryClient.setQueryData(getGetCartQueryKey(), { items: [], total: 0 });
      } catch (err) {
        console.error("Error clearing cart:", err);
      }
      await queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      await queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      await refetch();
      window.dispatchEvent(new Event(CART_EVENT));
    } else {
      updateLocalCart([]);
    }
  };

  const isInCart = (videoId: number) => {
    if (useServerCart) {
      return serverCartItems.some((i: any) => Number(i.videoId) === Number(videoId));
    }
    return localCart.some((i: any) => Number(i.videoId) === Number(videoId));
  };

  return {
    items,
    total,
    count: items.length,
    add,
    remove,
    clear,
    isInCart,
    isAdding: addToCartMut.isPending,
    refetchCart: refetch,
  };
}
