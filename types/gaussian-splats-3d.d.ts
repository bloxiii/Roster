/**
 * @mkkellogg/gaussian-splats-3d ne publie pas de types TypeScript.
 * Déclaration ambiante minimale — l'API réelle est bien plus large (voir
 * node_modules/@mkkellogg/gaussian-splats-3d/README.md) mais on ne type
 * ici que ce que components/tours/TourViewer.tsx utilise réellement.
 */
declare module "@mkkellogg/gaussian-splats-3d" {
  import type { Camera, WebGLRenderer } from "three";

  export type ViewerOptions = {
    selfDrivenMode?: boolean;
    renderer?: WebGLRenderer;
    camera?: Camera;
    useBuiltInControls?: boolean;
    sharedMemoryForWorkers?: boolean;
    gpuAcceleratedSort?: boolean;
    cameraUp?: [number, number, number];
    initialCameraPosition?: [number, number, number];
    initialCameraLookAt?: [number, number, number];
    [key: string]: unknown;
  };

  export type AddSplatSceneOptions = {
    showLoadingUI?: boolean;
    progressiveLoad?: boolean;
    splatAlphaRemovalThreshold?: number;
    position?: [number, number, number];
    rotation?: [number, number, number, number];
    scale?: [number, number, number];
    [key: string]: unknown;
  };

  export class Viewer {
    constructor(options?: ViewerOptions);
    addSplatScene(path: string, options?: AddSplatSceneOptions): Promise<void>;
    start(): void;
    update(): void;
    render(): void;
    dispose(): void;
  }

  export class DropInViewer extends Viewer {}
}
