import Worker from '@/utils/H264NALDecoder.worker';
import {MutableRefObject, useEffect, useRef, useState} from "react";

type onPictureReady = (message: any) => any;

function useDecoderInit(onPictureReady: onPictureReady, onNeedMoreData: () => any, onError: (message: any) => any) {
    let tinyH264Worker = useRef<Worker | null>(null);
    let promise = useRef<Promise<MutableRefObject<Worker | null>>>();
    let [isReady, setIsReady] = useState(false);
    useEffect(() => {
        tinyH264Worker.current = new Worker();
        const promise2: Promise<MutableRefObject<Worker | null>> = new Promise((resolve) => {
            tinyH264Worker.current?.addEventListener('message', (e) => {
                const message = e.data
                switch (message.type) {
                    case 'pictureReady':
                        onPictureReady(message);
                        break;
                    case 'needMoreData':
                        onNeedMoreData();
                        break;
                    case 'error':
                        onError(message);
                        break;
                    case 'decoderReady':
                        setIsReady(true);
                        resolve(tinyH264Worker);
                        break;
                }
            });
        });
        promise.current = promise2;
    }, []);

    return {
        promise,
        tinyH264Worker,
        getIsReady() {
            return isReady
        }
    };
}

export default useDecoderInit;
