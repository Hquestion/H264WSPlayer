import React, { useRef } from 'react';
import usePlayerInit from "./usePlayerInit";
import socketInit from "./socketInit";
import useDecoderInit from "./useDecoderInit";
import { isDocHidden, isIDR } from "../../tools/helper";
import useReverseControl from "./useReverseControl";

function Player() {
    const canvas = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const { drawPicture } = usePlayerInit(canvas);
    const { updateFrameSize } = useReverseControl(containerRef);
    const { tinyH264Worker, promise } = useDecoderInit(onPictureReady, onNeedMoreData, onError);
    promise.current?.then(() => socketInit(onReceiveBuffer));
    const h264samples: Uint8Array[] = [];
    const videoStreamId = 1;

    const onReceiveBuffer = function (data: Uint8Array) {
        if (!isDocHidden()) {
            if (h264samples.length > 4 && isIDR(data)) {
                console.error('积压了5帧以上，且接收到I帧，放弃之前所有帧');
                h264samples.length = 0;
            }
            h264samples.push(data);
        } else if (isIDR(data)) {
            h264samples.push(data);
        }
    };

    function onPictureReady(message: any) {
        // 绘制
        const { width, height, data } = message;
        drawPicture(new Uint8Array(data), width, height);
        updateFrameSize(width, height);
    }

    function onNeedMoreData() {
        // 当前数据无法解码，需要继续feed buffer，因为现在定时器解码，不需要做什么
        console.log('need more data!');
    }

    function onError(data: any) {
        // 解码失败
    }

    function decode(h264Nal: Uint8Array) {
        // 发送到worker中进行解码
        tinyH264Worker.current?.postMessage({
            type: 'decode',
            data: h264Nal.buffer,
            offset: h264Nal.byteOffset,
            length: h264Nal.byteLength,
            renderStateId: videoStreamId
        }, [h264Nal.buffer]);
    }

    function scheduleDecode() {
        requestAnimationFrame(() => {
            scheduleDecode();
        });
        let nextFrame = h264samples.shift();
        // // 积压5帧时丢帧
        // if (h264samples.length > 5) {
        //   nextFrame = h264samples.pop()
        //   h264samples.length = 0;
        // } else {
        //   nextFrame = h264samples.shift()
        // }
        if (!nextFrame) return;
        decode(nextFrame);
    }

    function release() {
        if (tinyH264Worker) {
            tinyH264Worker.current?.postMessage({ type: 'release', renderStateId: videoStreamId });
        }
    }

    scheduleDecode();

    return (
        <div className="mirror-player-wrapper" ref={containerRef}>
            {/* <div style={{ position: 'absolute', left: '10px', top: '10px', color: '#f00', fontSize: '40px' }}>当前帧队列：{h264samples.length}</div> */}
            <canvas ref={canvas} className="mirror-player" />
        </div>
    )
}

export default Player;
