import { useState, useEffect, useCallback } from "react";
import { 
  useGetCart, 
  useAddToCart, 
  useRemoveFromCart, 
  useClearCart,
  getGetCartQueryKey,
  Cart,
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

export function useCart() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [localCart, setLocalCart] = useState<CartItem[]>(getStoredLocalCart);

  const { data: serverCart, refetch } = useGetCart({
    query: {
      enabled: isAuthenticated,
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

  // Auto-sync guest cart items to the server when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      const stored = getStoredLocalCart();
      if (stored.length > 0) {
        const syncGuestItems = async () => {
          for (const item of stored) {
            if (!item?.videoId) continue;
            try {
              await addToCartMut.mutateAsync({ data: { videoId: item.videoId } });
            } catch {}
          }
          localStorage.removeItem("local_cart");
          setLocalCart([]);
          await queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          refetch();
          window.dispatchEvent(new Event(CART_EVENT));
        };
        syncGuestItems();
      }
    }
  }, [isAuthenticated]);

  const serverCartItems = Array.isArray(serverCart?.items) ? serverCart!.items : 
                          Array.isArray(serverCart) ? (serverCart as any) : [];
  const items: CartItem[] = isAuthenticated ? serverCartItems : localCart;
  const total = isAuthenticated 
    ? (serverCart?.total || 0)
    : localCart.reduce((acc, item) => acc + (item.discountPrice ?? item.price), 0);

  const add = async (item: CartItem) => {
    if (isAuthenticated) {
      try {
        const res = await addToCartMut.mutateAsync({ data: { videoId: item.videoId } });
        if (res && Array.isArray(res.items)) {
          queryClient.setQueryData(getGetCartQueryKey(), res);
        }
      } catch (err) {
        console.error("Error adding to cart:", err);
      }
      await queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      await queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      refetch();
      window.dispatchEvent(new Event(CART_EVENT));
    } else {
      const current = getStoredLocalCart();
      if (!current.find(i => i.videoId === item.videoId)) {
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
      refetch();
      window.dispatchEvent(new Event(CART_EVENT));
    } else {
      const current = getStoredLocalCart();
      updateLocalCart(current.filter(i => i.videoId !== videoId));
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
      refetch();
      window.dispatchEvent(new Event(CART_EVENT));
    } else {
      updateLocalCart([]);
    }
  };

  const isInCart = (videoId: number) => {
    return items.some((i: any) => i.videoId === videoId);
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

