ensure_repo() {
  local url name
  local "${@}"

  git -C ${name} pull || git clone ${url} ${name}
}

ensure_libav() {
  ensure_repo url='git://git.libav.org/libav' name='libav'
}

rm -rf libav-h264.js libav-h264.wasm libav-h264.worker.js

 ensure_libav

pushd libav

git checkout v12.3

emconfigure ./configure --cc="emcc" --ar="emar" --prefix="$(pwd)"/../dist --enable-cross-compile --target-os=none --arch=x86_32 --cpu=generic \
    --enable-gpl --enable-version3 --enable-nonfree --disable-avdevice --disable-avformat --disable-avfilter \
    --disable-swscale --disable-avresample \
    --disable-programs --disable-logging --disable-everything --enable-decoder=h264 \
    --disable-debug --disable-w32threads \
    --disable-asm --disable-doc --disable-devices --disable-network \
    --disable-hwaccels --disable-parsers --disable-bsfs \
    --disable-protocols --disable-indevs --disable-outdevs \
    --enable-lto --disable-pthreads \
    --disable-w32threads
  emmake make
  emmake make install

  popd
  echo "Running Emscripten..."
  emcc decoder/decoder.c -I./dist/include -s USE_PTHREADS=0 -O3 -msimd128 -c -o dist/decoder.bc
  EXPORTED_FUNCTIONS='["_malloc","_free","_init_lib","_create_codec_context","_destroy_codec_context","_decode"]'
  EXTRA_EXPORTED_RUNTIME_METHODS='["calledRun","getValue"]'
  emcc dist/decoder.bc dist/lib/libavcodec.a dist/lib/libavutil.a --memory-init-file 1 \
   --llvm-opts "['-tti', '-domtree', '-tti', '-domtree', '-deadargelim', '-domtree', '-instcombine', '-domtree', '-jump-threading', '-domtree', '-instcombine', '-reassociate', '-domtree', '-loops', '-loop-rotate', '-licm', '-domtree', '-instcombine', '-loops', '-loop-idiom', '-loop-unroll', '-memdep', '-memdep', '-memcpyopt', '-domtree', '-demanded-bits', '-instcombine', '-jump-threading', '-domtree', '-memdep', '-loops', '-licm', '-adce', '-domtree', '-instcombine', '-elim-avail-extern', '-float2int', '-domtree', '-loops', '-loop-rotate', '-demanded-bits', '-instcombine', '-domtree', '-instcombine', '-loops', '-loop-unroll', '-instcombine', '-licm', '-strip-dead-prototypes', '-domtree']" \
   --llvm-lto 3 -s ENVIRONMENT='worker' -s USE_CLOSURE_COMPILER=1 -s AGGRESSIVE_VARIABLE_ELIMINATION=1 -s NO_EXIT_RUNTIME=1 \
   -s INVOKE_RUN=0 -s DOUBLE_MODE=0 -s TOTAL_MEMORY=134217728 -s USE_PTHREADS=0 -O3 -o ./libav-h264.js -s EXPORTED_FUNCTIONS="$EXPORTED_FUNCTIONS" \
   -s EXTRA_EXPORTED_RUNTIME_METHODS="$EXTRA_EXPORTED_RUNTIME_METHODS"

   echo "Finished Build"
