import { useState, useEffect } from "react";
import { 
  useGetCart, 
  useAddToCart, 
  useRemoveFromCart, 
  useClearCart,
  CartItem
} from "@workspace/api-client-react";
import { useAuth } from "./use-auth";

export function useCart() {
  const { isAuthenticated } = useAuth();
  const [localCart, setLocalCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("local_cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const { data: serverCart, refetch } = useGetCart({
    query: {
      enabled: isAuthenticated
    }
  });

  const addToCartMut = useAddToCart();
  const removeFromCartMut = useRemoveFromCart();
  const clearCartMut = useClearCart();

  useEffect(() => {
    localStorage.setItem("local_cart", JSON.stringify(localCart));
  }, [localCart]);

  const items = isAuthenticated ? (serverCart?.items || []) : localCart;
  const total = isAuthenticated 
    ? (serverCart?.total || 0)
    : localCart.reduce((acc, item) => acc + (item.discountPrice ?? item.price), 0);

  const add = async (item: CartItem) => {
    if (isAuthenticated) {
      await addToCartMut.mutateAsync({ data: { videoId: item.videoId } });
      refetch();
    } else {
      if (!localCart.find(i => i.videoId === item.videoId)) {
        setLocalCart([...localCart, item]);
      }
    }
  };

  const remove = async (videoId: number) => {
    if (isAuthenticated) {
      await removeFromCartMut.mutateAsync({ videoId });
      refetch();
    } else {
      setLocalCart(localCart.filter(i => i.videoId !== videoId));
    }
  };

  const clear = async () => {
    if (isAuthenticated) {
      await clearCartMut.mutateAsync();
      refetch();
    } else {
      setLocalCart([]);
    }
  };

  const isInCart = (videoId: number) => {
    return items.some(i => i.videoId === videoId);
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
