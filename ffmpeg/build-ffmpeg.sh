#!/bin/sh

set -xe
git clone -b n4.2.1 https://github.com/ffmpeg/ffmpeg src || true
cd src

emconfigure ./configure \
	--cc=emcc --ar=emar --ranlib=emranlib --prefix=$(pwd)/../built --enable-cross-compile --target-os=none --arch=x86_32 --cpu=generic \
	--disable-stripping --enable-shared --disable-programs --disable-asm --disable-doc --disable-devices --disable-pthreads --disable-w32threads --disable-network --disable-debug --disable-xlib --disable-zlib --disable-sdl2 --disable-iconv --disable-everything --enable-protocol=file \
	--enable-bsf=aac_adtstoasc \
	--enable-decoder=mpeg2video --enable-decoder=h264 \
	--enable-decoder=mp3 --enable-decoder=aac \
    --enable-demuxer=flv --enable-demuxer=mov --enable-demuxer=mpegts \
	--enable-muxer=mp3 --enable-muxer=mp4

emmake make -j
emmake make install