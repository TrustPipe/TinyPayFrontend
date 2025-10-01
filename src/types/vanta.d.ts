declare module 'vanta/dist/vanta.fog.min' {
  import * as THREE from 'three';

  interface VantaFogConfig {
    el: HTMLElement;
    THREE?: typeof THREE;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    highlightColor?: number;
    midtoneColor?: number;
    lowlightColor?: number;
    baseColor?: number;
    blurFactor?: number;
    zoom?: number;
    speed?: number;
  }

  interface VantaEffect {
    destroy: () => void;
  }

  export default function FOG(config: VantaFogConfig): VantaEffect;
}

