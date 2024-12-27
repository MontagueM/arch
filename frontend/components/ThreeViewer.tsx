"use client";

import { useEffect, useRef } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import * as THREE from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

type GaussianViewerProps = {
  gaussianUrl?: string;
  glbUrl?: string;
};

export default function ThreeViewer({
  gaussianUrl,
  glbUrl,
}: GaussianViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(
      canvasRef.current.clientWidth,
      canvasRef.current.clientHeight,
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.debug.checkShaderErrors = true;
    renderer.debug.onShaderError = (error) => {
      console.error("Shader error:", error);
    };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x121212);

    const camera = new THREE.PerspectiveCamera(
      60,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 0, 1.5);

    const controls = new OrbitControls(camera, canvasRef.current);
    controls.enableDamping = true;

    const light = new THREE.AmbientLight(0xffffff, 8);
    scene.add(light);

    const loadModel = async () => {
      console.log("Loading model...");
      try {
        if (gaussianUrl) {
          const viewer = new GaussianSplats3D.DropInViewer();
          const eulerRot = new THREE.Euler((Math.PI * 3) / 2, 0, 0, "XYZ");
          const quatRot = new THREE.Quaternion();
          quatRot.setFromEuler(eulerRot);
          await viewer.addSplatScene(gaussianUrl, {
            splatAlphaRemovalThreshold: 5,
            format: GaussianSplats3D.SceneFormat.Ply,
            rotation: quatRot.toArray(),
            showLoadingUI: false,
          });
          // @ts-expect-error - wrong type declaration
          scene.add(viewer);
          console.log("viewer", viewer);
        }
        if (glbUrl) {
          const loader = new GLTFLoader().setKTX2Loader(new KTX2Loader());
          renderer.render(scene, camera);
          const gltf = await loader.loadAsync(glbUrl);
          const model = gltf.scene;
          const mesh = model.children[0].children[0] as THREE.Mesh;
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.metalness = 0;
          model.rotation.set(0, 0, 0);
          renderer.compile(scene, camera);
          scene.add(model);
          renderer.compile(scene, camera);
          renderer.render(scene, camera);
        }
      } catch (err) {
        console.error("Failed to load model:", err);
        alert("Failed to load model. Please check the URL or file format.");

        const boxColor = 0xbbbbbb;
        const boxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const boxMesh = new THREE.Mesh(
          boxGeometry,
          new THREE.MeshStandardMaterial({ color: boxColor }),
        );
        boxMesh.position.set(0, 0, 0);
        scene.add(boxMesh);
      }

      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();
    };

    void loadModel();

    const handleResize = () => {
      if (!canvasRef.current) return;
      const { clientWidth, clientHeight } = canvasRef.current;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      scene.clear();
    };
  }, [gaussianUrl, glbUrl]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
