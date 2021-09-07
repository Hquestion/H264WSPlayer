# H264 Player

A websocket h264 player written in React.

> forked from https://github.com/udevbe/ffmpeg-h264-wasm.git

## Getting Start

### start 

```
yarn
yarn run start
```

### build

```
yarn run build
```


## Fixed Bugs

- rendered green screen on different dimensions
- green edge when use ```gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)```;

## Build libav with emscripten

I tried to build libav with emscripten on Mac and Windows, and I failed.Finally,I successfully
build it on Docker.So I will introduce how to build with docker.

### Download Docker

Check the Docker official website for help.

### Get emscripten image

```shell
docker pull emscripten/emsdk
```

### Run build-libav.sh 

On Windows:

```shell
npm run build:libav:win
```

Or on Linux:

```shell
npm run build:libav:linux
```

## Useful Links

- [https://stackoverflow.com/questions/51582282/error-when-creating-textures-in-webgl-with-the-rgb-format](https://stackoverflow.com/questions/51582282/error-when-creating-textures-in-webgl-with-the-rgb-format)

