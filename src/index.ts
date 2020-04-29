import wasm from "./wasm-module-types"

// Parcel に wasm をロードさせずコピーだけさせてパスを取る方法がこれしか思い付かなかった
const wasmPath = document.querySelector<HTMLLinkElement>(`link[data-wasm-file]`).href

const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 0))

var fps = 0
var waitPerSec = 0
setInterval(() => {
    document.getElementById("fps").innerText = `decode: ${fps}fps wait: ${waitPerSec}call/sec`
    fps = 0
    waitPerSec = 0
}, 1000)

const canvas = document.getElementById("canvas") as HTMLCanvasElement
const fileSelector = document.getElementById("file") as HTMLInputElement
const start = document.getElementById("start") as HTMLButtonElement

const audioPlayer = document.getElementById("audio") as HTMLAudioElement

// Firefox の HTMLMediaElement.currentTime が25FPSぐらいでしか更新されないので
// いい感じにごまかす
const isFirefox = navigator.userAgent.includes("Firefox") && !location.hash.includes("disable-firefox-patches")
if (isFirefox) console.log("Firefox patches enabled (you can disable with #disable-firefox-patches URL parameter)")
let lastCurrentTime = 0
let lastUpdatedMsec = performance.now()
let now = performance.now()
const highResCurrentTime = isFirefox
    ? () => {
          const add = now - lastUpdatedMsec
          const expected = lastCurrentTime + add / 1000
          const diff = Math.abs(audioPlayer.currentTime - expected)
          // console.log(diff)
          const resetLine = diff > 0.075
          if (resetLine) console.log("reset line")
          if (resetLine || audioPlayer.paused) {
              // 100ms以上ズレたかpausedで強制同期
              lastCurrentTime = audioPlayer.currentTime
              lastUpdatedMsec = now
              return lastCurrentTime
          }
          return expected
      }
    : () => audioPlayer.currentTime

const wasmBinaryFetch = fetch(wasmPath).then((r) => r.arrayBuffer())

async function load(flv: ArrayBuffer) {
    start.innerText = "Loading WASM..."
    const module = wasm({
        wasmBinary: await wasmBinaryFetch,
        // noInitialRun: true,
        preRun: [
            () => {
                module.FS.createDataFile("/", "input.flv", new Uint8Array(flv), true, false, false)
            },
        ],
        postRun: [
            async () => {
                start.innerText = "Processing Audio..."
                const audioFile = new module.AVAudioFile("/input.flv")
                console.log(audioFile)
                if (!audioFile.isFailed) {
                    console.log(audioFile.path())
                    audioFile.output()
                }
                if (audioFile.isFailed) return alert("failed to decode audio! (see browser developer tools console)")
                const audioFilePath = audioFile.path()
                const audio: Uint8Array = module.FS.readFile(audioFilePath, {
                    encoding: "binary",
                })
                const file = new File([audio], audioFilePath, {
                    type: `audio/${audioFilePath.split(".")[1]}`,
                })
                audioPlayer.src = URL.createObjectURL(file)

                start.innerText = "Processing Video..."
                const videoFile = new module.AVVideoFile("/input.flv")
                if (videoFile.isFailed) return alert("failed to decode file! (see browser developer tools console)")
                console.log(videoFile)
                const width = videoFile.width()
                const height = videoFile.height()
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext("2d")
                const imgDat = ctx.createImageData(width, height)
                // audioPlayer.play()
                const timeBase = videoFile.timeBase()
                console.log(timeBase)
                function ptsToMsec(pts: number) {
                    return (pts * timeBase[0]) / (timeBase[1] / 1000)
                }
                start.innerText = "Ready!"

                var skipRenderFrame = 0
                var isFirst = true
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    while (videoFile.readFrame() == 0) {
                        const isVideoStream = videoFile.isVideoStream()
                        if (isVideoStream) {
                            if (videoFile.sendPacket() != 0) {
                                console.error("avcodec_send_packet failed")
                            }
                            while (videoFile.receiveFrame() == 0) {
                                fps++
                                skipRenderFrame++
                                const received: Uint8Array = videoFile.convertFrameToRGB()
                                imgDat.data.set(received)

                                now = performance.now()
                                const pts = ptsToMsec(videoFile.pts())
                                if (
                                    pts < Math.floor(highResCurrentTime() * 1000) - 100 ||
                                    pts > Math.floor(highResCurrentTime() * 1000) + 1100
                                ) {
                                    if (highResCurrentTime() == 0) {
                                        const res = videoFile.seekToFirst()
                                        if (res < 0) alert(`failed to seek (${res})`)
                                    }
                                    audioPlayer.currentTime = pts / 1000
                                    lastCurrentTime = audioPlayer.currentTime
                                }
                                ctx.putImageData(imgDat, 0, 0)
                                if (
                                    isFirst || // 最初のフレームは書く
                                    skipRenderFrame > 10 || // 2フレーム以上レンダリングしてない場合
                                    pts > Math.floor(highResCurrentTime() * 1000) // ptsがaudioPlayer.currentTimeを越える時
                                ) {
                                    isFirst = false
                                    skipRenderFrame = 0
                                    waitPerSec++
                                    do {
                                        await nextFrame()
                                        now = performance.now()
                                    } while (
                                        pts > Math.floor(highResCurrentTime() * 1000) &&
                                        pts < Math.floor(highResCurrentTime() * 1000) + 1500
                                    )
                                }
                            }
                        }
                        videoFile.packetUnref()
                    }
                    do {
                        await nextFrame()
                    } while (audioPlayer.currentTime >= 1)
                    const res = videoFile.seekToFirst()
                    if (res < 0) alert(`failed to seek (${res})`)
                }
            },
        ],
    })
    window["module"] = module
    console.log("yay")
}

start.addEventListener("click", () => {
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
