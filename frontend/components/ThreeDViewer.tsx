// components/ThreeDViewer.tsx
"use client";

import { useEffect, useRef } from "react";
import * as BABYLON from "babylonjs";
import "@babylonjs/loaders";
type ThreeDViewerProps = {
  data: string;
};

export default function ThreeDViewer({ data }: ThreeDViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize BabylonJS engine and scene
    const engine = new BABYLON.Engine(canvasRef.current, true);
    engineRef.current = engine;
    const scene = new BABYLON.Scene(engine);
    sceneRef.current = scene;

    // Set up camera
    const camera = new BABYLON.ArcRotateCamera(
      "Camera",
      0,
      Math.PI / 2,
      2,
      BABYLON.Vector3.Zero(),
      scene,
    );
    camera.minZ = 0;
    // reduce zoom sensitivity
    camera.wheelPrecision = 50;
    camera.attachControl(canvasRef.current, true);

    // Set up lighting
    const light = new BABYLON.HemisphericLight(
      "HemiLight",
      new BABYLON.Vector3(0, 1, 0),
      scene,
    );
    light.intensity = 0.7;

    // Setup gaussian splat
    // BABYLON.SceneLoader.ImportMeshAsync(
    //   null,
    //   data,
    //   undefined,
    //   scene,
    //   undefined,
    //   "splat",
    //   "blob.ply",
    // ).then((result) => {
    //   const gaussianSplattingMesh = result.meshes[0];
    //   gaussianSplattingMesh.position = new BABYLON.Vector3(0, 0, 0);
    //   gaussianSplattingMesh.rotation = new BABYLON.Vector3(0, Math.PI, 0);
    //   console.log("Loaded mesh", gaussianSplattingMesh);
    // });
    let gs;
    const loadModel = async (url: string) => {
      try {
        gs = new BABYLON.GaussianSplattingMesh("gs", null, scene);
        await gs.loadFileAsync(url);
        // rotate
        gs.rotation = new BABYLON.Vector3(
          (Math.PI * 3) / 2,
          (Math.PI * 3) / 2,
          0,
        );
        gs.position = new BABYLON.Vector3(0, 0, 0);
      } catch (err) {
        console.error("Failed to load model:", err);
        alert("Failed to load model. Please check the URL or file format.");
        // Fallback: Provide a placeholder model
        gs = BABYLON.MeshBuilder.CreateBox("fallbackBox", {}, scene);
      }
    };

    loadModel(data);

    // Start the render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      engine.dispose();
    };
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
