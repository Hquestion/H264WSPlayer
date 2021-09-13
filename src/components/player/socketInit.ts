const LOCAL_WS_SERVER_URL = "ws://localhost:3000";
// 开发环境连接服务器时，通过反向代理转发http请求，使用绝对地址连接websocket，生产环境通过location获取
const useAbsoluteHost = process.env.NODE_ENV === 'production' ? false : true;
const ABSOLUTE_HOST = '10.10.107.253'
const SERVER_HOST = useAbsoluteHost ? ABSOLUTE_HOST : window.location.hostname;
let ws: any;
let isConnecting = false;
let lockReconnect = false;
let tt: any | null = null;
let onReceiveDataCallback: (buffer: Uint8Array) => void | undefined;

const MAX_RETRY = 10;
let tryTimes = 0;

export function sendMessage(message: string | Record<any, any>) {
    if (!ws) {
        throw new Error('Socket尚未连接!');
    }
    if (!message) return;
    if (typeof message === 'object') {
        message = JSON.stringify(message);
    }
    if (ws.readyState === 1) {
        ws.send(message);
    }
}

function reconnect() {
    if (tryTimes > MAX_RETRY) {
        console.error(`达到最大重连尝试次数${MAX_RETRY}，取消此次重连操作`);
        return;
    }
    if (lockReconnect) {
        return;
    }
    lockReconnect = true;
    //没连接上会一直重连，设置延迟避免请求过多
    tt && clearTimeout(tt);
    tt = setTimeout(function () {
        tryTimes++;
        socketInit(onReceiveDataCallback)?.finally(() => {
            lockReconnect = false;
        });
    }, 3000);
}

function socketInit(onReceiveData: (buffer: Uint8Array) => void): Promise<any> {

    onReceiveDataCallback = onReceiveData;

    let pktnum = 0;
    if (isConnecting) return Promise.reject(undefined);
    isConnecting = true;
    return fetch('/ws').then(function (response) {
        return response.json();
    }).then(function (res) {
        const port = res.data;
        if (/(ws|wss):\/\//.test(port)) {
            return port;
        }
        return 'ws://' + SERVER_HOST + ':' + res.data;
    }).catch(function (err) {
        console.warn('获取ws地址异常，使用默认地址:', LOCAL_WS_SERVER_URL);
        return LOCAL_WS_SERVER_URL;
    }).then(url => {
        try {
            ws = new WebSocket(url);
            ws.binaryType = "arraybuffer";
        } catch (e) {
            reconnect();
            throw e;
        }
        ws.onopen = () => {
            isConnecting = false;
            tryTimes = 0;
            console.log("Connected to " + url);
            // 发送系统信息
            sendMessage({
                cmd: 'webInfo',
                width: window.innerWidth * window.devicePixelRatio,
                height: window.innerHeight * window.devicePixelRatio
            });
        };
        ws.onmessage = (evt: any) => {
            // TODO 处理其他类型消息
            if (typeof evt.data == "string") return;
            pktnum++;
            const frame = new Uint8Array(evt.data);
            // console.log("[Pkt " + pktnum + " (" + evt.data.byteLength + " bytes)]");
            //this.decode(frame);
            onReceiveData(frame);
        };

        ws.onerror = () => {
            isConnecting = false;
            console.error('error: WS连接异常，尝试重连');
            reconnect();
        };

        ws.onclose = () => {
            isConnecting = false;
            console.error('WS连接断开，尝试重连');
            reconnect();
        };
        return ws;
    });
}

export default socketInit;
