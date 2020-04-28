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
const audioPlayer = document.getElementById("audio") as HTMLAudioElement;

start.addEventListener("click", e => {
    if (fileSelector.files.length < 1) return alert("ファイルを選択してください")
    start.disabled = true
    start.innerText = "Loading File..."
    const file = fileSelector.files.item(0)
    const reader = new FileReader()
    reader.readAsArrayBuffer(file)
    reader.onload = () => {
        load(reader.result as ArrayBuffer)
    }
    console.log(file)
})

async function load(flv: ArrayBuffer) {
    start.innerText = "Loading WASM..."
    const module: EmscriptenModule = wasm({
        locateFile: () => wasmPath,
        // noInitialRun: true,
        preRun: [() => {
            module["FS_createDataFile"]("/", "input.flv", new Uint8Array(flv), true, false, false)
        }],
        postRun: [async () => {
            start.innerText = "Processing Audio..."
            const audioFile = new module["AVAudioFile"]("/input.flv");
            console.log(audioFile);
            if (!audioFile.isFailed) {
                console.log(audioFile.path())
                module["FS_createDataFile"]("/", audioFile.path().split("/").slice(-1)[0], new Uint16Array([]), true, true, true)
                audioFile.output()
            }
            if (audioFile.isFailed) return alert("failed to decode audio! (see browser developer tools console)")
            const audioFilePath = audioFile.path()
            const audio: Uint8Array = module["FS"].readFile(audioFilePath, {encoding: "binary"})
            const file = new File([audio], audioFilePath, {type: `audio/${audioFilePath.split(".")[1]}`})
            audioPlayer.src = URL.createObjectURL(file)

            start.innerText = "Processing Video..."
            const videoFile = new module["AVVideoFile"]("/input.flv");
            if (videoFile.isFailed) return alert("failed to decode file! (see browser developer tools console)")
            console.log(videoFile);
            const width = videoFile.width();
            const height = videoFile.height();
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            const imgDat = ctx.createImageData(width, height);
            // audioPlayer.play()
            const timeBase = videoFile.timeBase();
            console.log(timeBase);
            function ptsToMsec(pts: number) {
                return (pts*timeBase[0])/(timeBase[1]/1000)
            }
            start.innerText = "Ready!"
            while (videoFile.readFrame() == 0) {
                const isVideoStream = videoFile.isVideoStream()
                if (isVideoStream) {
                    if (videoFile.sendPacket() != 0) {
                        console.error("avcodec_send_packet failed");
                    }
                    while (videoFile.receiveFrame() == 0) {
                        fps++
                        const received: Uint8Array = videoFile.convertFrameToRGB();
                        imgDat.data.set(received);

                        const pts = ptsToMsec(videoFile.pts())
                        if (pts < (Math.floor(audioPlayer.currentTime * 1000) - 100)) {
                            audioPlayer.currentTime = pts / 1000
                        }
                        while (pts > Math.floor(audioPlayer.currentTime*1000)) {
                            await nextFrame();
                        }

                        ctx.putImageData(imgDat, 0, 0)
                    }
                }
                videoFile.packetUnref();
            }
            console.log(videoFile);
        }]
    })
    window["module"] = module
    console.log("yay")
}
