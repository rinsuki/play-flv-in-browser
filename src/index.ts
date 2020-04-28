import wasm from "../wasm/build/wasm-module.js"

// Parcel に wasm をロードさせずコピーだけさせてパスを取る方法がこれしか思い付かなかった
const wasmPath = document.querySelector<HTMLLinkElement>(`link[data-wasm-file]`).href

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

var fps = 0
setInterval(() => {
    document.getElementById("fps").innerText = `${fps}fps`
    fps = 0
}, 1000)

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const fileSelector = document.getElementById("file") as HTMLInputElement;
const start = document.getElementById("start") as HTMLButtonElement;

start.addEventListener("click", e => {
    if (fileSelector.files.length < 1) return alert("ファイルを選択してください")
    start.disabled = true
    const file = fileSelector.files.item(0)
    const reader = new FileReader()
    reader.readAsArrayBuffer(file)
    reader.onload = () => {
        load(reader.result as ArrayBuffer)
    }
    console.log(file)
})

async function load(flv: ArrayBuffer) {
    const module: EmscriptenModule = wasm({
        locateFile: () => wasmPath,
        // noInitialRun: true,
        preRun: [() => {
            module["FS_createDataFile"]("/", "input.flv", new Uint8Array(flv), true, false, false)
        }],
        postRun: [async () => {
            const file = new module["AVFile"]("/input.flv");
            if (file.isFailed) return alert("failed to decode file! (see browser developer tools console)")
            console.log(file);
            var ctx: CanvasRenderingContext2D | undefined = undefined
            var imgDat: ImageData | undefined = undefined
            while (file.readFrame() == 0) {
                const isVideoStream = file.isVideoStream()
                if (isVideoStream) {
                    if (file.sendPacket() != 0) {
                        console.error("avcodec_send_packet failed");
                    }
                    while (file.receiveFrame() == 0) {
                        fps++
                        if (imgDat == null || ctx == null) {
                            const width = file.width();
                            const height = file.height();
                            canvas.width = width;
                            canvas.height = height;
                            ctx = canvas.getContext("2d");
                            imgDat = ctx.createImageData(width, height);
                        }
                        const received: Uint8Array = file.convertFrameToRGB();
                        imgDat.data.set(received);
                        ctx.putImageData(imgDat, 0, 0)
                        await nextFrame();
                    }
                }
                file.packetUnref();
            }
            console.log(file);
        }]
    })
    window["module"] = module
    console.log("yay")
}
