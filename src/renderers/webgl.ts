const vs = `
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main(void) {
    v_texCoord = a_texCoord;
    gl_Position = vec4((a_texCoord.x * 2.0) - 1.0, 1.0 - (a_texCoord.y * 2.0), 0, 1);
}`

const fs = `
precision mediump float;
uniform sampler2D sampler0;
uniform sampler2D sampler1;
uniform sampler2D sampler2;
const mat3 kColorConv = mat3(
    1.164, 1.164, 1.164,
    0.0, -0.213, 2.112,
    1.793, -0.533, 0.0
);
varying vec2 v_texCoord;
void main(void) {
    mediump vec3 yuv;
    lowp vec3 rgb;
    yuv.x = (texture2D(sampler0, v_texCoord).x - (16.0 / 255.0)); 
    yuv.y = (texture2D(sampler1, v_texCoord).x - 0.5);
    yuv.z = (texture2D(sampler2, v_texCoord).x - 0.5);
    rgb = kColorConv * yuv;
    gl_FragColor = vec4(rgb, 1.0);
}`

export class WebGLRenderer {
    gl: WebGLRenderingContext

    constructor(public canvas: HTMLCanvasElement) {
        console.warn("Using WebGLRenderer")
        const { width, height } = canvas
        const gl = canvas.getContext("webgl")
        this.gl = gl
        const program = this.createShader()
        gl.viewport(0, 0, width, height)
        const texCoord = gl.getAttribLocation(program, "a_texCoord")
        gl.enableVertexAttribArray(texCoord)
        const uvPos = new Float32Array([0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0])
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
        gl.bufferData(gl.ARRAY_BUFFER, uvPos, gl.STATIC_DRAW)
        gl.vertexAttribPointer(texCoord, 2, gl.FLOAT, false, 0, 0)
        for (let i = 0; i < 3; i++) {
            gl.activeTexture([gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2][i])
            gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.uniform1i(gl.getUniformLocation(program, `sampler${i}`), i)
        }
    }

    render(videoFile: { outputArray(index: 0 | 1 | 2): Uint8Array }) {
        const gl = this.gl
        const { width, height } = this.canvas
        for (let i = 0; i < 3; i++) {
            gl.activeTexture([gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2][i])
            if (i === 0) {
                // y
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.LUMINANCE,
                    width,
                    height,
                    0,
                    gl.LUMINANCE,
                    gl.UNSIGNED_BYTE,
                    videoFile.outputArray(i),
                )
            } else if (i === 1 || i === 2) {
                // u or v
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.LUMINANCE,
                    width / 2,
                    height / 2,
                    0,
                    gl.LUMINANCE,
                    gl.UNSIGNED_BYTE,
                    videoFile.outputArray(i),
                )
            }
        }
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
        gl.flush()
    }

    compileShader(type: number, text: string) {
        const gl = this.gl
        const shader = gl.createShader(type)
        gl.shaderSource(shader, text)
        gl.compileShader(shader)
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error("Failed to compile shader: " + gl.getShaderInfoLog(shader))
        }
        return shader
    }

    createShader() {
        const gl = this.gl
        const program = gl.createProgram()
        gl.attachShader(program, this.compileShader(gl.VERTEX_SHADER, vs))
        gl.attachShader(program, this.compileShader(gl.FRAGMENT_SHADER, fs))
        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error("Failed to link GL program: " + gl.getProgramInfoLog(program))
        }
        gl.useProgram(program)
        return program
    }
}
