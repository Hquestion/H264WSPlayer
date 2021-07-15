import Worker from './H264NALDecoder.worker'
import YUVSurfaceShader from './YUVSurfaceShader'
import Texture from './Texture'
const YUVCanvas = require('./YUVCanvas');
console.log(Worker);

let tinyH264Worker = null
let videoStreamId = 1
let player = null;

let canvas = null
/**
 * @type {YUVSurfaceShader}
 */
let yuvSurfaceShader = null
let yTexture = null
let uTexture = null
let vTexture = null

let nroFrames = 0
let start = 0
/**
 * @type {Array<Uint8Array>}
 */
const h264samples = []

/**
 * @param {Uint8Array} h264Nal
 */
function decode (h264Nal) {
  tinyH264Worker.postMessage({
    type: 'decode',
    data: h264Nal.buffer,
    offset: h264Nal.byteOffset,
    length: h264Nal.byteLength,
    renderStateId: videoStreamId
  }, [h264Nal.buffer])
}

/**
 * @param {{width:number, height:number, data: ArrayBuffer}}message
 */
function onPictureReady (message) {
  const { width, height, data } = message
  onPicture(new Uint8Array(data), width, height)
}

let startDate = 0;
let now = 0;
let count = 0;
    /**
 * @param {Uint8Array}buffer
 * @param {number}width
 * @param {number}height
 */
function onPicture (buffer, width, height) {
  count++;
  if (startDate === 0) {
    startDate = now = +new Date();
  } else {
    now = +new Date();
    if (now - startDate > 1000) {
      console.error('1s内解码：' + count + '帧');
      startDate = now;
      count = 0;
    }
  }
  // canvas.width = width
  // canvas.height = height
  //
  // // the width & height returned are actually padded, so we have to use the frame size to get the real image dimension
  // // when uploading to texture
  // const stride = width // stride
  // // height is padded with filler rows
  //
  // // if we knew the size of the video before encoding, we could cut out the black filler pixels. We don't, so just set
  // // it to the size after encoding
  // const sourceWidth = width
  // const sourceHeight = height
  // const maxXTexCoord = sourceWidth / stride
  // const maxYTexCoord = sourceHeight / height
  //
  // const lumaSize = stride * height
  // const chromaSize = lumaSize >> 2
  //
  // const yBuffer = buffer.subarray(0, lumaSize)
  // const uBuffer = buffer.subarray(lumaSize, lumaSize + chromaSize)
  // const vBuffer = buffer.subarray(lumaSize + chromaSize, lumaSize + (2 * chromaSize))
  //
  // const chromaHeight = height >> 1
  // const chromaStride = stride >> 1
  //
  // // we upload the entire image, including stride padding & filler rows. The actual visible image will be mapped
  // // from texture coordinates as to crop out stride padding & filler rows using maxXTexCoord and maxYTexCoord.
  //
  // yTexture.image2dBuffer(yBuffer, stride, height)
  // uTexture.image2dBuffer(uBuffer, chromaStride, chromaHeight)
  // vTexture.image2dBuffer(vBuffer, chromaStride, chromaHeight)
  //
  // yuvSurfaceShader.setTexture(yTexture, uTexture, vTexture)
  // yuvSurfaceShader.updateShaderData({ w: width, h: height }, { maxXTexCoord, maxYTexCoord })
  // yuvSurfaceShader.draw()
  if (!player || player.canvas.width !== width || player.canvas.height !== height) {
    // release();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowRatio = windowWidth / windowHeight;
    const picRatio = width / height;
    player = player || {};
    player.canvas = player.canvas || {};
    player.canvas.width = width;
    player.canvas.height = height;
    if (picRatio > windowRatio) {
      canvas.style.width = windowWidth + 'px';
      canvas.style.height = windowWidth / picRatio + 'px';
    } else {
      canvas.style.height = windowHeight + 'px';
      canvas.style.width = windowHeight * picRatio + 'px';
    }
    player.webGLCanvas = new YUVCanvas({
      canvas: canvas,
      contextOptions: {},
      width: width,
      height: height
    });
  }
  var ylen = width * height;
  var uvlen = (width / 2) * (height / 2);

  player.webGLCanvas.drawNextOutputPicture({
    yData: buffer.subarray(0, ylen),
    uData: buffer.subarray(ylen, ylen + uvlen),
    vData: buffer.subarray(ylen + uvlen, ylen + uvlen + uvlen)
  });
}

function release () {
  if (tinyH264Worker) {
    tinyH264Worker.postMessage({ type: 'release', renderStateId: videoStreamId })
    tinyH264Worker = null
  }
}

function decodeNext () {
  let nextFrame = h264samples.shift();
  // // 积压5帧时丢帧
  // if (h264samples.length > 5) {
  //   nextFrame = h264samples.pop()
  //   h264samples.length = 0;
  // } else {
  //   nextFrame = h264samples.shift()
  // }
  if (nextFrame != null) {
    decode(nextFrame)
  }
  requestAnimationFrame(() => {
    decodeNext();
  })
}

function onNeedMoreData () {
  decodeNext()
}

function onError (message) {
  const { errorCode } = message
  console.log('error', errorCode)
  decodeNext()
}

function initWebGLCanvas () {
  canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl')
  yuvSurfaceShader = YUVSurfaceShader.create(gl)
  yTexture = Texture.create(gl, gl.LUMINANCE)
  uTexture = Texture.create(gl, gl.LUMINANCE)
  vTexture = Texture.create(gl, gl.LUMINANCE)

  document.body.append(canvas)
}
let isStarted = false;
function startDecode() {
  if (isStarted) {
    return;
  }
  decodeNext();
  isStarted = true;
}

function main () {
  initWebGLCanvas()
  new Promise((resolve) => {
    /**
     * @type {Worker}
     * @private
     */
    tinyH264Worker = new Worker()
    tinyH264Worker.addEventListener('message', (e) => {
      const message = e.data
      switch (message.type) {
        case 'pictureReady':
          onPictureReady(message)
          break
        case 'needMoreData':
          onNeedMoreData()
          break
        case 'error':
          onError(message)
        case 'decoderReady':
          resolve(tinyH264Worker)
          break
      }
    })
  }).then(() => {
    // const fetches = []
    // for (let i = 0; i < 60; i++) {
    //   fetches.push(fetch(`h264samples/${i}`).then(response => {
    //     return response.arrayBuffer().then(function (buffer) {
    //       h264samples[i] = new Uint8Array(buffer)
    //     })
    //   }))
    // }
    // return Promise.all(fetches)

    var ws;
    var WS_SERVER_URL = "ws://10.10.101.44:3000";
    fetch('/ws').then(function (response) {
      return response.json();
    }).then(function (res) {
      // return 'ws://' + location.hostname + ':' + res.data;
      return 'ws://10.10.105.64:' + res.data;
    }).catch(function (err) {
      console.warn('获取ws地址异常，使用默认地址:', WS_SERVER_URL);
      return WS_SERVER_URL;
    }).then(url => {
      ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        console.log("Connected to " + url);
      };

      var framesList = [];
      var pktnum = 0;

      ws.onmessage = (evt) => {
        if (typeof evt.data == "string") return;
        pktnum++;
        var frame = new Uint8Array(evt.data);
        //log("[Pkt " + this.pktnum + " (" + evt.data.byteLength + " bytes)]");
        //this.decode(frame);
        h264samples.push(frame);
        start = Date.now()
        startDecode()
      };
    })
  })
  //     .then(() => {
  //   nroFrames = h264samples.length
  //   start = Date.now()
  //   decodeNext()
  // })
}

main()
