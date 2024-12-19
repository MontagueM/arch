// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Box, TextField, Button, Divider, Stack } from "@mui/material";
import DropZone from "../components/DropZone";
import { useGlobalState } from "../lib/state";

export default function HomePage() {
  const router = useRouter();
  const { setPrompt, setDroppedImage } = useGlobalState();
  const [localPrompt, setLocalPrompt] = useState(
    "isometric view, a black backpack with a red stripe",
  );
  const [localFile, setLocalFile] = useState<File | null>(null);

  const handleGenerateImages = () => {
    if (!localPrompt.trim()) return;
    setPrompt(localPrompt);
    router.push("/prompt"); // This will lead to loading and then show images
  };

  const handleGenerate3DViewFromImage = () => {
    if (!localFile) return;
    setDroppedImage(localFile);
    router.push("/three-d-view?fromImage=1"); // This simulates going directly to 3D generation page
  };

  return (
    <Box
      sx={{
        maxWidth: 600,
        margin: "0 auto",
        padding: 2,
      }}
    >
      <Stack spacing={4}>
        {/* Text Prompt Section */}
        <Stack spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Enter text prompt"
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            variant="outlined"
          />
          <Button
            variant="contained"
            onClick={handleGenerateImages}
            disabled={!localPrompt.trim()}
            fullWidth
          >
            Generate Images
          </Button>
        </Stack>

        <Divider />

        {/* Image Drop Section */}
        <Stack spacing={2} alignItems="center">
          <DropZone onDrop={(file) => setLocalFile(file)} />
          <Button
            variant="contained"
            onClick={handleGenerate3DViewFromImage}
            disabled={!localFile}
            fullWidth
          >
            Generate 3D View
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
