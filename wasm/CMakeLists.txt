cmake_minimum_required(VERSION 3.5)
project(PlayFLVInBrowser)

set(CMAKE_C_FLAGS "-s MODULARIZE=1 -s FORCE_FILESYSTEM=1 --bind -s EXTRA_EXPORTED_RUNTIME_METHODS='[\"ALLOC_DYNAMIC\", \"allocate\", \"FS\"]' -s INITIAL_MEMORY=268435456 -s USE_PTHREADS=1 -s PTHREAD_POOL_SIZE=4")
set(CMAKE_CXX_FLAGS "-s MODULARIZE=1 -s FORCE_FILESYSTEM=1 --bind -s EXTRA_EXPORTED_RUNTIME_METHODS='[\"ALLOC_DYNAMIC\", \"allocate\", \"FS\"]' -s INITIAL_MEMORY=268435456 -s USE_PTHREADS=1 -s PTHREAD_POOL_SIZE=4")

# Load FFMPEG
get_filename_component(FFMPEG_PKGCONFIG_PATH "../ffmpeg/built/lib/pkgconfig" ABSOLUTE)
set(ENV{PKG_CONFIG_PATH} "${FFMPEG_PKGCONFIG_PATH}")
message("$ENV{PKG_CONFIG_PATH}")
include(FindPkgConfig)
pkg_check_modules(FFMPEG REQUIRED libavformat libavcodec libavutil libswscale libswresample)
include_directories(BEFORE SYSTEM ${FFMPEG_INCLUDE_DIRS})
link_directories(${FFMPEG_LIBRARY_DIRS})
link_libraries(${FFMPEG_LIBRARIES})

set(SOURCE_FILES main.cpp)
add_executable(wasm-module ${SOURCE_FILES})