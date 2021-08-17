import wasm from "../wasm/build/wasm-module.js"

// TODO: generate directly from AVVideoFile.hpp or main.cpp
declare class AVAudioFile {
    constructor(filePath: string)
    output(): void
    path(): string
    readonly isFailed: boolean
}

declare class AVVideoFile {
    constructor(filePath: string)
    readFrame(): number
    isVideoStream(): boolean
    packetUnref(): void
    sendPacket(): number
    receiveFrame(): number
    width(): number
    height(): number
    getPixFmt(): void
    convertFrameToRGB(): Uint8Array
    outputArray(index: 0 | 1 | 2): Uint8Array
    pts(): number
    timeBase(): [number, number]
    seekToFirst(): number
    readonly isFailed: boolean
}

declare interface WASMModule extends EmscriptenModule {
    FS: typeof FS
    AVAudioFile: typeof AVAudioFile
    AVVideoFile: typeof AVVideoFile
}

export default wasm as WASMModule
