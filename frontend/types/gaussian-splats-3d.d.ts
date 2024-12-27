declare module "@mkkellogg/gaussian-splats-3d" {
  import { Scene, Vector3, PerspectiveCamera, WebGLRenderer } from "three";

  export class DropInViewer extends THREE.Group {
    constructor(options?: DropInViewerOptions);

    addSplatScene(path: string, options?: SplatSceneOptions): AbortablePromise;
    addSplatScenes(
      sceneOptions: SplatSceneOptions[],
      showLoadingUI?: boolean,
    ): AbortablePromise;
    getSplatScene(sceneIndex: number): SplatScene;
    removeSplatScene(index: number, showLoadingUI?: boolean): AbortablePromise;
    removeSplatScenes(
      indexes: number[],
      showLoadingUI?: boolean,
    ): AbortablePromise;
    getSceneCount(): number;
    setActiveSphericalHarmonicsDegrees(
      activeSphericalHarmonicsDegrees: number,
    ): void;
    dispose(): Promise<void>;

    static onBeforeRender(
      viewer: DropInViewer,
      renderer: WebGLRenderer,
      threeScene: Scene,
      camera: PerspectiveCamera,
    ): void;
    static createCallbackMesh(): THREE.Mesh;
  }

  export interface DropInViewerOptions {
    cameraUp?: Vector3;
    initialCameraPosition?: Vector3;
    initialCameraLookAt?: Vector3;
    dropInMode?: boolean;
    selfDrivenMode?: boolean;
    useBuiltInControls?: boolean;
    rootElement?: HTMLElement;
    ignoreDevicePixelRatio?: boolean;
    halfPrecisionCovariancesOnGPU?: boolean;
    threeScene?: Scene;
    renderer?: WebGLRenderer;
    camera?: PerspectiveCamera;
    gpuAcceleratedSort?: boolean;
  }

  export const SceneFormat = {
    Splat: 0,
    KSplat: 1,
    Ply: 2,
  };

  export interface SplatSceneOptions {
    path?: string;
    splatAlphaRemovalThreshold?: number;
    position?: number[];
    rotation?: number[];
    scale?: number[];
    headers?: Record<string, string>;
    format?: SceneFormat;
    showLoadingUI?: boolean;
  }

  export class AbortablePromise extends Promise<void> {
    abort(): void;
  }

  export class SplatScene {
    // Define properties and methods relevant to the SplatScene
  }
}
