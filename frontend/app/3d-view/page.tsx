// app/three-d-view/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Stack,
} from "@mui/material";
import { useGlobalState } from "../../lib/state";
import { generate3DView } from "../../lib/api";
import ThreeDViewer from "../../components/ThreeDViewer";

export default function ThreeDViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromImage = searchParams.get("fromImage");
  const { selectedImage, droppedImage } = useGlobalState();
  const [loading, setLoading] = useState(true);
  const [viewData, setViewData] = useState<any>(null);

  useEffect(() => {
    const srcImage = fromImage ? droppedImage : selectedImage;
    if (!srcImage) {
      router.push("/");
      return;
    }
    (async () => {
      const data = await generate3DView(srcImage);
      setViewData(data);
      setLoading(false);
    })();
  }, [fromImage, selectedImage, droppedImage, router]);

  if (loading) {
    return (
      <Stack direction="row" alignItems="center" spacing={2}>
        <CircularProgress />
        <Typography>Generating 3D Radiance Field...</Typography>
      </Stack>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        3D Radiance Field
      </Typography>
      <Box sx={{ width: "100%", height: "400px", border: "1px solid #ccc" }}>
        <ThreeDViewer data={viewData} />
      </Box>
      <Stack direction="row" spacing={2} mt={2}>
        <Button variant="contained" onClick={() => router.push("/mesh")}>
          Generate Mesh
        </Button>
        <Button onClick={() => router.refresh()}>Rerun 3D View</Button>
        <Button
          onClick={() => {
            if (fromImage) {
              router.push("/");
            } else {
              router.push("/choose-image");
            }
          }}
        >
          Go Back
        </Button>
      </Stack>
    </Box>
  );
}
