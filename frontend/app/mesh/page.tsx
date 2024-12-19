// app/mesh/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Stack,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useGlobalState } from "../../lib/state";
import { generateMesh } from "../../lib/api";

export default function MeshPage() {
  const router = useRouter();
  const { selectedImage, droppedImage } = useGlobalState();
  const [loading, setLoading] = useState(true);
  const [meshUrl, setMeshUrl] = useState<string | null>(null);

  useEffect(() => {
    const srcImage = droppedImage || selectedImage;
    if (!srcImage) {
      router.push("/");
      return;
    }
    (async () => {
      const glbUrl = await generateMesh(srcImage);
      setMeshUrl(glbUrl);
      setLoading(false);
    })();
  }, [selectedImage, droppedImage, router]);

  if (loading) {
    return (
      <Stack direction="row" alignItems="center" spacing={2}>
        <CircularProgress />
        <Typography>Generating Mesh (GLB)...</Typography>
      </Stack>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Generated Mesh
      </Typography>
      {meshUrl && (
        <Box>
          <Typography>Mesh ready! You can download it below:</Typography>
          <a href={meshUrl} download>
            Download GLB
          </a>
        </Box>
      )}
      <Stack direction="row" spacing={2} mt={2}>
        <Button onClick={() => router.push("/three-d-view")}>Go Back</Button>
        <Button onClick={() => router.push("/")}>Start Over</Button>
      </Stack>
    </Box>
  );
}
