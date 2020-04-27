import wasm from "../wasm/build/wasm-module.js"

// Parcel に wasm をロードさせずコピーだけさせてパスを取る方法がこれしか思い付かなかった
const wasmPath = document.querySelector<HTMLLinkElement>(`link[data-wasm-file]`).href
const flvPath = document.querySelector<HTMLLinkElement>(`link[data-flv-file]`).href

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

fetch(flvPath).then(flv => flv.arrayBuffer()).then(flv => {
    const module: EmscriptenModule = wasm({
        locateFile: () => wasmPath,
        // noInitialRun: true,
        preRun: [() => {
            module["FS_createDataFile"]("/", "input.flv", new Uint8Array(flv), true, false, false)
        }],
        postRun: [async () => {
            const file = new module["AVFile"]("/input.flv");
            console.log(file);
            while (file.readFrame() == 0) {
                const isVideoStream = file.isVideoStream()
                if (isVideoStream) {
                    if (file.sendPacket() != 0) {
                        console.error("avcodec_send_packet failed");
                    }
                    while (file.receiveFrame() == 0) {
                        console.log("receiving frame");
                    }
                } else {
                }
                file.packetUnref();
            }
            console.log(file);
        }]
    })
    window.module = module
    console.log("yay")
})
