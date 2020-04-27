import wasm from "../wasm/build/wasm-module.js"

// Parcel に wasm をロードさせずコピーだけさせてパスを取る方法がこれしか思い付かなかった
const wasmPath = document.querySelector<HTMLLinkElement>(`link[data-wasm-file]`).href
const flvPath = document.querySelector<HTMLLinkElement>(`link[data-flv-file]`).href

fetch(flvPath).then(flv => flv.arrayBuffer()).then(flv => {
    const module = wasm({
        locateFile: () => wasmPath,
        // noInitialRun: true,
        preRun: [() => {
            module.FS_createDataFile("/", "input.flv", new Uint8Array(flv), true, false, false)
        }]
    })
    window.module = module
    console.log("yay")
})
