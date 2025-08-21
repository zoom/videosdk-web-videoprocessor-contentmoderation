importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest');
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-cpu')
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl')
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd')
// importScripts('https://cdn.jsdelivr.net/npm/glur/index.js')

/** @import { VideoProcessor } from '@zoom/videosdk' */
class GLProcessor extends VideoProcessor {
    /** @type {WebGL2RenderingContext} */
    gl = null;
    /** @type {WebGLProgram} */
    program = null;
    /** @type {WebGLBuffer} */
    quadVBO = null;
    /** @type {WebGLTexture} */
    videoTex = null;
    moderationLabels = ['cell phone'];
    model = null;
    ctx = null;

    constructor(port, options) {
        super(port, options);
    }

    async onInit() {
        const output = this.getOutput();
        this.model = await cocoSsd.load();
        if (!output) return;
        // this.gl = output.getContext("webgl2", { alpha: true });
        this.ctx = output.getContext("2d");
        if (!this.gl) return;
        // this._initWebGL();
    }

    // _initWebGL() {
    //     const gl = this.gl;

    //     const createShader = (type, source) => {
    //         const shader = gl.createShader(type);
    //         gl.shaderSource(shader, source);
    //         gl.compileShader(shader);
    //         if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    //             throw new Error(gl.getShaderInfoLog(shader));
    //         }
    //         return shader;
    //     };

    //     const vs = createShader(gl.VERTEX_SHADER, `#version 300 es
    //     in vec2 a_pos; out vec2 v_uv;
    //     void main() {
    //       v_uv = vec2((a_pos.x + 1.0) * 0.5, (-a_pos.y + 1.0) * 0.5);
    //       gl_Position = vec4(a_pos, 0, 1);
    //     }`);

    //     const fs = createShader(gl.FRAGMENT_SHADER, `#version 300 es
    //     precision mediump float;
    //     in vec2 v_uv; uniform sampler2D u_tex; out vec4 outColor;
    //     void main() { outColor = texture(u_tex, v_uv); }`);

    //     // Link program
    //     this.program = gl.createProgram();
    //     gl.attachShader(this.program, vs);
    //     gl.attachShader(this.program, fs);
    //     gl.linkProgram(this.program);
    //     if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
    //         throw new Error(gl.getProgramInfoLog(this.program));
    //     }

    //     // Setup quad VBO
    //     this.quadVBO = gl.createBuffer();
    //     gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
    //     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    //     const posLoc = gl.getAttribLocation(this.program, 'a_pos');
    //     gl.enableVertexAttribArray(posLoc);
    //     gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    //     // Setup video texture
    //     this.videoTex = gl.createTexture();
    //     gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // }

    onUninit() {
        this.gl = null;
        this.program = null;
        this.quadVBO = null;
        this.videoTex = null;
    }

    /**
    //  * @param {VideoFrame} input 
     * @param {OffscreenCanvas} output 
     */
    async processFrame(input, output) {
        // if (!this.gl || !this.program || !this.quadVBO || !this.videoTex) return false;

        // const gl = this.gl;
        // gl.viewport(0, 0, output.width, output.height);
        // gl.clearColor(0, 0, 0, 0);
        // gl.clear(gl.COLOR_BUFFER_BIT);

        // Upload video frame to texture
        // const bitmap = await createImageBitmap(input);

        //also run tensorflow object detection
        // const prediction = await this.model.detect(tf.browser.fromPixels(bitmap));
        // input.close();
        // gl.activeTexture(gl.TEXTURE0);
        // gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
        // bitmap.close();

        // Draw video frame
        // gl.useProgram(this.program);
        // gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
        // gl.uniform1i(gl.getUniformLocation(this.program, 'u_tex'), 0);
        // gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // const [r, g, b, a] = [49/255, 2/255, 250/255, 0.8]

        // // Draw magenta square overlay
        // gl.enable(gl.SCISSOR_TEST);
        // gl.scissor(100, 100, 200, 200);
        // gl.clearColor(r, g, b, a);
        // gl.clear(gl.COLOR_BUFFER_BIT);
        // gl.disable(gl.SCISSOR_TEST);

        const bitmap = await createImageBitmap(input);
        const prediction = await this.model.detect(tf.browser.fromPixels(bitmap));

        this.ctx.drawImage(input, 0, 0, output.width, output.height);

        this.ctx.strokeStyle = "blue"
        this.ctx.lineWidth = 2;
        // this.ctx.filter = "blur(4px)";


        prediction.forEach((obj) => {
            const [x, y, width, height, label, score] = [obj.bbox[0], obj.bbox[1], obj.bbox[2], obj.bbox[3], obj.class, obj.score]
            // this.ctx.fillText(`${label} - ${Math.round(score * 100)}%`, x + 5, y - 3);
            // this.ctx.strokeRect(x, y, width, height);
            this.ctx.fillStyle = "red";
            if (this.moderationLabels.includes(label))
                this.ctx.fillRect(x, y, width, height);

            // const img = this.ctx.getImageData(x, y, width, height);
            // blurRGBA(img, x, y, 65)
            // this.ctx.putImageData(imageData, x, y);
        });

        console.log("Prediction", prediction)
        input.close();
        bitmap.close();

        return true;

    }
}

/** @import { registerProcessor } from '@zoom/videosdk' */
registerProcessor('gl-processor', GLProcessor);