import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-cpu'
import '@tensorflow/tfjs-backend-webgl'
import * as cocoSsd from '@tensorflow-models/coco-ssd'

const model = await cocoSsd.load();

export async function runPrediction(input: VideoFrame) {
    const imageBitmap = await createImageBitmap(input);
        const prediction = this.model.detect(tf.browser.fromPixels(imageBitmap));
        console.log(prediction);
        return prediction;
}