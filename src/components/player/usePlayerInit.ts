import {MutableRefObject, useEffect, useState} from "react";
// import YUVSurfaceShader from "@/utils/YUVSurfaceShader";
// import Texture from "@/utils/Texture";
import YUVCanvas from "./YUVCanvas";

interface IPlayer {
    canvas: HTMLCanvasElement | null,
    webGLCanvas: YUVCanvas | null
}

function usePlayerInit(canvasRef: MutableRefObject<HTMLCanvasElement | null>) {
    // let gl, yuvSurfaceShader, yTexture, uTexture, vTexture;
    const [ player, setPlayer ] = useState<IPlayer | null>({
        canvas: canvasRef.current,
        webGLCanvas: null
    });
    useEffect(() => {
        if (canvasRef.current) {
            // gl = canvasRef.current.getContext('webgl')
            // if (!gl) return;
            // yuvSurfaceShader = YUVSurfaceShader.create(gl)
            // yTexture = Texture.create(gl, gl.LUMINANCE);
            // uTexture = Texture.create(gl, gl.LUMINANCE);
            // vTexture = Texture.create(gl, gl.LUMINANCE);

            setPlayer({
                canvas: canvasRef.current,
                webGLCanvas: null
            });
        }
    }, []);

    function drawPicture(buffer: Uint8Array, width: number, height: number) {
        if (!player || player?.canvas?.width !== width || player.canvas.height !== height) {
            // release();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const windowRatio = windowWidth / windowHeight;
            const picRatio = width / height;
            if (player) {
                player.canvas = player?.canvas || canvasRef.current;
                if (player.canvas) {
                    player.canvas.width = width;
                    player.canvas.height = height;
                }
            }
            if (canvasRef.current && player) {
                if (picRatio > windowRatio) {
                    canvasRef.current.style.width = '100vw';
                    canvasRef.current.style.height = 100 / picRatio + 'vw';
                } else {
                    canvasRef.current.style.height = 100 + 'vh';
                    canvasRef.current.style.width = 100 * picRatio + 'vh';
                }
                player.webGLCanvas = new YUVCanvas({
                    canvas: canvasRef.current,
                    contextOptions: {},
                    width: width,
                    height: height
                });
            }
        }
        const ylen = width * height;
        const uvlen = (width / 2) * (height / 2);

        player?.webGLCanvas?.drawNextOutputPicture({
            yData: buffer.subarray(0, ylen),
            uData: buffer.subarray(ylen, ylen + uvlen),
            vData: buffer.subarray(ylen + uvlen, ylen + uvlen + uvlen)
        });
    }
    return {
        drawPicture
    };
}

export default usePlayerInit;
