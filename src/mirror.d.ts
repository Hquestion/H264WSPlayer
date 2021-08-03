declare module YUVSurfaceShader{}

declare module '@/utils/Texture' {
    export const create: (gl: WebGLRenderingContext | null, format: number | null | undefined) => any;
}

declare module '@/utils/YUVSurfaceShader' {
    export const create: (gl: WebGLRenderingContext | null) => any;
}

declare module '@/utils/H264NALDecoder.worker' {
    type listener = (name: string, callback: (e: any) => any) => void
    export default class DecoderWorker {
        addEventListener: listener;
        postMessage: (data: any, buffer?: any) => void;
    }
}

declare module '@/utils/YUVCanvas' {
    export default class YUVCanvas {
        constructor(options: any);
        drawNextOutputPicture: Function
    }
}

declare module 'yuv-canvas' {
    export function attach(canvas: any, options?: any) {}
}

declare module 'yuv-buffer' {
    export function frame(e: any, y?: any, u?: any, v?: any) {}
    export function format(e: any) {}
    export type YUVFormat = any;
}

interface Document {
    webkitHidden: boolean;
    mozHidden: boolean;
}
