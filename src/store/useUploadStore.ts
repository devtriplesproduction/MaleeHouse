import { create } from "zustand";

interface ActiveUpload {
  id: string;
  fileName: string;
  progress: number;
  status: "uploading" | "success" | "error";
}

interface UploadState {
  uploads: Record<string, ActiveUpload>;
  startUpload: (id: string, fileName: string) => void;
  updateProgress: (id: string, progress: number) => void;
  completeUpload: (id: string) => void;
  failUpload: (id: string) => void;
  removeUpload: (id: string) => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  uploads: {},
  startUpload: (id, fileName) => 
    set((state) => ({
      uploads: { ...state.uploads, [id]: { id, fileName, progress: 0, status: "uploading" } }
    })),
  updateProgress: (id, progress) => 
    set((state) => ({
      uploads: { ...state.uploads, [id]: { ...state.uploads[id], progress } }
    })),
  completeUpload: (id) => 
    set((state) => ({
      uploads: { ...state.uploads, [id]: { ...state.uploads[id], status: "success", progress: 100 } }
    })),
  failUpload: (id) => 
    set((state) => ({
      uploads: { ...state.uploads, [id]: { ...state.uploads[id], status: "error" } }
    })),
  removeUpload: (id) => 
    set((state) => {
      const { [id]: _, ...rest } = state.uploads;
      return { uploads: rest };
    }),
}));
