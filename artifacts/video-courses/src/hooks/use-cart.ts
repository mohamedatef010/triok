import { useState, useEffect, useCallback } from "react";
import { 
  useGetCart, 
  useAddToCart, 
  useRemoveFromCart, 
  useClearCart,
  CartItem
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
    } as any,
  });


  const addToCartMut = useAddToCart();
  const removeFromCartMut = useRemoveFromCart();
  const clearCartMut = useClearCart();

  // Listen to cart events across all components & browser tabs
  useEffect(() => {
    const handleCartSync = () => {
      setLocalCart(getStoredLocalCart());
    };
    window.addEventListener(CART_EVENT, handleCartSync);
    window.addEventListener("storage", handleCartSync);
    return () => {
      window.removeEventListener(CART_EVENT, handleCartSync);
      window.removeEventListener("storage", handleCartSync);
    };
  }, []);

  const updateLocalCart = useCallback((newCart: CartItem[]) => {
    setLocalCart(newCart);
    localStorage.setItem("local_cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event(CART_EVENT));
  }, []);

  const serverCartItems = Array.isArray(serverCart?.items) ? serverCart!.items : 
                          Array.isArray(serverCart) ? (serverCart as any) : [];
  const items = isAuthenticated ? serverCartItems : localCart;
  const total = isAuthenticated 
    ? (serverCart?.total || 0)
    : localCart.reduce((acc, item) => acc + (item.discountPrice ?? item.price), 0);

  const add = async (item: CartItem) => {
    if (isAuthenticated) {
      await addToCartMut.mutateAsync({ data: { videoId: item.videoId } });
      await queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      refetch();
    } else {
      const current = getStoredLocalCart();
      if (!current.find(i => i.videoId === item.videoId)) {
        updateLocalCart([...current, item]);
      }
    }
  };

  const remove = async (videoId: number) => {
    if (isAuthenticated) {
      await removeFromCartMut.mutateAsync({ videoId });
      await queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      refetch();
    } else {
      const current = getStoredLocalCart();
      updateLocalCart(current.filter(i => i.videoId !== videoId));
    }
  };

  const clear = async () => {
    if (isAuthenticated) {
      await clearCartMut.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      refetch();
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
  };
}

