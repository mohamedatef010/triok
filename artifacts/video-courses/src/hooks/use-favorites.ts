import { useState, useEffect, useCallback } from "react";
import { 
  useGetFavorites, 
  useAddToFavorites, 
  useRemoveFromFavorites,
  Video
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

const FAVS_EVENT = "video_courses_favs_updated";

function getStoredLocalFavs(): Video[] {
  try {
    const stored = localStorage.getItem("local_favs");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [localFavs, setLocalFavs] = useState<Video[]>(getStoredLocalFavs);

  const { data: serverFavs, refetch } = useGetFavorites({
    query: {
      enabled: isAuthenticated,
    } as any,
  });


  const addToFavMut = useAddToFavorites();
  const removeFromFavMut = useRemoveFromFavorites();

  // Listen to favorites events across components & tabs
  useEffect(() => {
    const handleFavsSync = () => {
      setLocalFavs(getStoredLocalFavs());
    };
    window.addEventListener(FAVS_EVENT, handleFavsSync);
    window.addEventListener("storage", handleFavsSync);
    return () => {
      window.removeEventListener(FAVS_EVENT, handleFavsSync);
      window.removeEventListener("storage", handleFavsSync);
    };
  }, []);

  const updateLocalFavs = useCallback((newFavs: Video[]) => {
    setLocalFavs(newFavs);
    localStorage.setItem("local_favs", JSON.stringify(newFavs));
    window.dispatchEvent(new Event(FAVS_EVENT));
  }, []);

  const serverFavList = Array.isArray(serverFavs) ? serverFavs : [];
  const items = isAuthenticated ? serverFavList : localFavs;

  const add = async (video: Video) => {
    if (isAuthenticated) {
      await addToFavMut.mutateAsync({ videoId: video.id });
      await queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      await queryClient.invalidateQueries({ queryKey: ["favorites"] });
      refetch();
    } else {
      const current = getStoredLocalFavs();
      if (!current.find(i => i.id === video.id)) {
        updateLocalFavs([...current, video]);
      }
    }
  };

  const remove = async (videoId: number) => {
    if (isAuthenticated) {
      await removeFromFavMut.mutateAsync({ videoId });
      await queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      await queryClient.invalidateQueries({ queryKey: ["favorites"] });
      refetch();
    } else {
      const current = getStoredLocalFavs();
      updateLocalFavs(current.filter(i => i.id !== videoId));
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

