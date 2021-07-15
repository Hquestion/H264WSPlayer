/**
 * 支持反控能力
 */
import {MutableRefObject, useEffect, useRef} from "react";
import { sendMessage } from "./socketInit";

let windowHeight = window.innerHeight,
    windowWidth = window.innerWidth,
    screenWidth: number,
    screenHeight: number;
let isFrameReady = false;

function getStreamRect(videoWidth: number, videoHeight: number) {
    const streamRatio = videoWidth / videoHeight;
    const screenRatio = windowWidth / windowHeight;
    let left, top, width, height;
    // 如果流宽高比大于屏幕宽高比，则流宽度铺满，高度自适应居中
    if (streamRatio >= screenRatio) {
        width = windowWidth;
        height = width / streamRatio;
        left = 0;
        top = (windowHeight - height) / 2;
    } else {
        // 否则，高度铺满，宽度自适应
        height = windowHeight;
        width = height * streamRatio;
        top = 0;
        left = (windowWidth - width) / 2;
    }
    return {
        left, top, width, height
    };
}

/**
 * web上的坐标转换成手机坐标
 * @param x
 * @param y
 * @param fixOutOfBounds 是否修正超出边界的情况
 */
function transformCords(x: number, y: number, fixOutOfBounds?: boolean) : undefined | { x: number, y: number } {
    const videoRect = getStreamRect(screenWidth, screenHeight);
    const { left, top, width, height } = videoRect;
    if (x < left || x > left + width || y < top || y > top + height) {
        if (!!fixOutOfBounds) {
            let fixedX = 0, fixedY = 0;
            if (x < left) {
                fixedX = left;
            } else if (x > left + width) {
                fixedX = left + width - 1;
            }
            if (y < top) {
                fixedY = top;
            } else if (y > top + height) {
                fixedY = top + height - 1;
            }
            return {
                x: (fixedX - left) * (screenWidth / width),
                y: (fixedY - top) * (screenHeight / height)
            }
        }
        console.warn('坐标不在屏幕上，不处理触摸事件');
        return;
    }
    const screenX = (x - left) * (screenWidth / width);
    const screenY = (y - top) * (screenHeight / height);
    return {
        x: screenX,
        y: screenY
    }
}

function updateFrameSize(width: number, height: number) {
    screenWidth = width;
    screenHeight = height;
    isFrameReady = true;
}

function useReverseControl(containerRef: MutableRefObject<HTMLDivElement | null>) {
    // TODO 反控
    const isTouchStart = useRef<boolean>(false);

    function ontouchstart(event: any){
        event.preventDefault();
        if (!isFrameReady) return;
        const touches = event.changedTouches || [event];
        const cords = transformCords(touches[0].pageX, touches[0].pageY);
        if (cords) {
            const { x, y } = cords;
            sendMessage({cmd: 'touchdown', x, y});
            isTouchStart.current = true;
        }
    }
    function ontouchmove(event: any){
        event.preventDefault();
        if (!isFrameReady) return;
        const touches = event.changedTouches || [event];
        const cords = transformCords(touches[0].pageX, touches[0].pageY);
        if(!cords) {
            console.log('移出屏幕...', isTouchStart.current)
            if(isTouchStart.current) {
                const { x, y } = transformCords(touches[0].pageX, touches[0].pageY, true) || {x:0, y: 0};
                sendMessage({cmd: 'touchup', x, y});
                isTouchStart.current = false;
            }
            return;
        }
        const { x, y } = cords;
        if(isTouchStart.current) {
            sendMessage({cmd: 'touchmove', x, y});
        } else {
            if (event.changedTouches) {
                sendMessage({cmd: 'touchdown', x, y});
                isTouchStart.current = true;
            }
        }
    }

    function ontouchend(event: any){
        event.preventDefault();
        if (!isFrameReady) return;
        const touches = event.changedTouches || [event];
        const cords = transformCords(touches[0].pageX, touches[0].pageY);
        if (cords) {
            const { x, y } = cords;
            sendMessage({cmd: 'touchup', x, y});
            isTouchStart.current = false;
        }
    }

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            const canvas = container.querySelector('canvas');
            windowWidth = window.innerWidth;
            windowHeight = window.innerHeight;
            if (canvas) {
                screenHeight = canvas.height;
                screenWidth = canvas.width;
            }
            container.addEventListener('touchstart', ontouchstart, false);
            container.addEventListener('touchmove',ontouchmove , false);
            container.addEventListener('touchend',ontouchend , false);

            container.addEventListener('mousedown', ontouchstart, false);
            container.addEventListener('mousemove',ontouchmove , false);
            container.addEventListener('mouseup',ontouchend , false);
        }
    }, []);
    return {
        updateFrameSize
    }
}

export default useReverseControl;
