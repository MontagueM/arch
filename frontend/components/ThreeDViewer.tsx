// components/ThreeDViewer.tsx
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type ThreeDViewerProps = {
  data: any;
};

export default function ThreeDViewer({ data }: ThreeDViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#fff");
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x0033ff });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, [data]);

  return <div style={{ width: "100%", height: "100%" }} ref={mountRef} />;
}
