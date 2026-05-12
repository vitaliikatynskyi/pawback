declare module '@tensorflow/tfjs';

declare module '@tensorflow-models/mobilenet' {
  interface Prediction {
    className: string;
    probability: number;
  }
  interface Tensor {
    data(): Promise<Float32Array>;
    dispose(): void;
  }
  interface MobileNet {
    classify(img: HTMLImageElement): Promise<Prediction[]>;
    infer(img: HTMLImageElement, embedding?: boolean): Tensor;
  }
  export function load(): Promise<MobileNet>;
}
