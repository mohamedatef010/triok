import { useState, useEffect } from "react";
import { 
  useGetFavorites, 
  useAddToFavorites, 
  useRemoveFromFavorites,
  Video
} from "@workspace/api-client-react";
import { useAuth } from "./use-auth";

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const [localFavs, setLocalFavs] = useState<Video[]>(() => {
    try {
      const stored = localStorage.getItem("local_favs");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const { data: serverFavs, refetch } = useGetFavorites({
    query: {
      enabled: isAuthenticated
    }
  });

  const addToFavMut = useAddToFavorites();
  const removeFromFavMut = useRemoveFromFavorites();

  useEffect(() => {
    localStorage.setItem("local_favs", JSON.stringify(localFavs));
  }, [localFavs]);

  const serverFavList = Array.isArray(serverFavs) ? serverFavs : [];
  const items = isAuthenticated ? serverFavList : localFavs;

  const add = async (video: Video) => {
    if (isAuthenticated) {
      await addToFavMut.mutateAsync({ videoId: video.id });
      refetch();
    } else {
      if (!localFavs.find(i => i.id === video.id)) {
        setLocalFavs([...localFavs, video]);
      }
    }
  };

  const remove = async (videoId: number) => {
    if (isAuthenticated) {
      await removeFromFavMut.mutateAsync({ videoId });
      refetch();
    } else {
      setLocalFavs(localFavs.filter(i => i.id !== videoId));
    }
  };

  const isFavorite = (videoId: number) => {
    return items.some(i => i.id === videoId);
  };

  const toggle = async (video: Video) => {
    if (isFavorite(video.id)) {
      await remove(video.id);
    } else {
      await add(video);
    }
  };

  return {
    items,
    count: items.length,
    add,
    remove,
    toggle,
    isFavorite,
    isPending: addToFavMut.isPending || removeFromFavMut.isPending
  };
}
