// app/choose-image/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useGlobalState } from "../../lib/state";
import { Box, Typography, Button, Stack } from "@mui/material";
import { useEffect, useState } from "react";

export default function ChooseImagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const indexParam = searchParams.get("index");
  const { generatedImages, setSelectedImage } = useGlobalState();
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (!generatedImages || indexParam === null) {
      router.push("/");
      return;
    }
    const idx = parseInt(indexParam, 10);
    if (generatedImages[idx]) {
      setImage(generatedImages[idx]);
    } else {
      router.push("/");
    }
  }, [generatedImages, indexParam, router]);

  const handleConfirm = () => {
    if (!image) return;
    setSelectedImage(image);
    router.push("/three-d-view");
  };

  if (!image) return null;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Confirm Image Selection
      </Typography>
      <img src={image} alt="Selected" style={{ maxWidth: "100%" }} />
      <Stack direction="row" spacing={2} mt={2}>
        <Button variant="contained" onClick={handleConfirm}>
          Generate 3D View
        </Button>
        <Button onClick={() => router.push("/prompt")}>Go Back</Button>
      </Stack>
    </Box>
  );
}
