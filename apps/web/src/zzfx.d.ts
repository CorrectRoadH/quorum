// ZzFX ships without types.
declare module 'zzfx' {
  export function zzfx(...parameters: ReadonlyArray<number>): AudioBufferSourceNode
  export const ZZFX: {
    sampleRate: number
    buildSamples: (...parameters: ReadonlyArray<number>) => Float32Array
    playSamples: (
      channels: ReadonlyArray<Float32Array>,
      volume?: number,
      rate?: number,
      pan?: number,
    ) => AudioBufferSourceNode
  }
}
