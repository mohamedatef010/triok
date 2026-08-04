import { create } from "zustand";
import { persist } from "zustand/middleware";
import { VideoDetail } from "@workspace/api-client-react";

interface CompareStore {
  videos: VideoDetail[];
  addVideo: (video: VideoDetail) => void;
  removeVideo: (id: number) => void;
  clear: () => void;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set) => ({
      videos: [],
      addVideo: (video) =>
        set((state) => {
          if (state.videos.find((v) => v.id === video.id)) return state;
          if (state.videos.length >= 3) {
            // max 3
            return { videos: [...state.videos.slice(1), video] };
          }
          return { videos: [...state.videos, video] };
        }),
      removeVideo: (id) =>
        set((state) => ({
          videos: state.videos.filter((v) => v.id !== id),
        })),
      clear: () => set({ videos: [] }),
    }),
    {
      name: "video-compare-storage",
    }
  )
);
