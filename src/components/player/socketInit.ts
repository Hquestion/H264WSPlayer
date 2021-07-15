const LOCAL_WS_SERVER_URL = "ws://10.10.101.44:3000";
const useAbsoluteHost = true;
const ABSOLUTE_HOST = '10.10.105.109'
const SERVER_HOST = useAbsoluteHost ? ABSOLUTE_HOST : window.location.host;
let ws: any;
let isConnecting = false;

export function sendMessage(message: string | Record<any, any>) {
    if (!ws) {
        throw new Error('Socket尚未连接!');
    }
    if (!message) return;
    if (typeof message === 'object') {
        message = JSON.stringify(message);
    }
    ws.send(message);
}

function socketInit(onReceiveData: (buffer: Uint8Array) => void) {
    let pktnum = 0;
    if (isConnecting) return;
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
        ws = new WebSocket(url);
        ws.binaryType = "arraybuffer";

        ws.onopen = () => {
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
            console.error('WS连接异常，尝试重连');
        };

        ws.onclose = () => {
            console.error('WS连接断开，尝试重连');
        };
        return ws;
    });
}

export default socketInit;
