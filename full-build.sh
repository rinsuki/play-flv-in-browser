#!/bin/sh
set -xe

cd ffmpeg
./build-ffmpeg.sh 

cd ../wasm
mkdir -p build
cd build
emcmake cmake ..
emmake make

cd ../..
yarn parcel build ./src/index.html