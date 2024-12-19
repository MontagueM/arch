// lib/state.ts
"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from "react";

type GlobalState = {
  prompt: string;
  setPrompt: (p: string) => void;
  generatedImage: string | null;
  setGeneratedImage: (img: string) => void;
  selectedImage: string | null;
  setSelectedImage: (img: string | null) => void;
  droppedImage: File | null;
  setDroppedImage: (f: File | null) => void;
};

const StateContext = createContext<GlobalState | undefined>(undefined);

export function StateProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [droppedImage, setDroppedImage] = useState<File | null>(null);

  const value = useMemo(
    () => ({
      prompt,
      setPrompt,
      generatedImage,
      setGeneratedImage,
      selectedImage,
      setSelectedImage,
      droppedImage,
      setDroppedImage,
    }),
    [prompt, generatedImage, selectedImage, droppedImage],
  );

  return (
    <StateContext.Provider value={value}>{children}</StateContext.Provider>
  );
}

export function useGlobalState() {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error("useGlobalState must be used within a StateProvider");
  }
  return context;
}
