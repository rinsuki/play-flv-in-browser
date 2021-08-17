export class CanvasRenderer {
    ctx: CanvasRenderingContext2D
    imageData: ImageData

    constructor(public canvas: HTMLCanvasElement) {
        console.warn("Using CanvasRenderer")
        const { width, height } = canvas
        this.ctx = canvas.getContext("2d")
        this.imageData = this.ctx.createImageData(width, height)
    }

    render(videoFile: { convertFrameToRGB(): Uint8Array }) {
        const received: Uint8Array = videoFile.convertFrameToRGB()
        this.imageData.data.set(received)
        this.ctx.putImageData(this.imageData, 0, 0)
    }
}
