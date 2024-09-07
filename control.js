const videoElement = document.getElementsByClassName("input_video")[0];
const canvasElement = document.getElementsByClassName("output_canvas")[0];
const canvasCtx = canvasElement.getContext("2d");

const cameraWidth = 640;
const cameraHeight = 360;

const smoothingFactor = 0.7;
const speedCoef = 1.2;

const xdivision = 4;

let prevX = null;
let prevY = null;

function drawPoint(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarkX = results.multiHandLandmarks[0][8].x * canvasElement.width;
        const landmarkY = results.multiHandLandmarks[0][8].y * canvasElement.height;

        canvasCtx.fillStyle = "yellow";
        canvasCtx.beginPath();
        canvasCtx.arc(landmarkX, landmarkY, 5, 0, Math.PI * 2);
        canvasCtx.fill();
    }
}

function canvas(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasElement.width,
        canvasElement.height
    );
    drawPoint(results);
    canvasCtx.restore();
}

function updateMouseCursor(x, y) {
    let w = window.innerWidth / cameraWidth;
    let h = window.innerHeight / cameraHeight;

    window.game.input.x = x * w * speedCoef;
    window.game.input.y = y * h * speedCoef;
}

function landmark(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const x = results.multiHandLandmarks[0][8].x * canvasElement.width;
        const y = results.multiHandLandmarks[0][8].y * canvasElement.height;

        if (prevX === null || prevY === null) {
            prevX = x;
            prevY = y;
        }

        const mirroredX = canvasElement.width - x - canvasElement.width / xdivision;

        const smoothedX = prevX * (1 - smoothingFactor) + mirroredX * smoothingFactor;
        const smoothedY = prevY * (1 - smoothingFactor) + y * smoothingFactor;

        prevX = smoothedX;
        prevY = smoothedY;

        updateMouseCursor(smoothedX, smoothedY);
    } else {
        prevX = null;
        prevY = null;
        console.log("No hand landmarks detected.");
    }
}

function execution(results) {
    canvas(results);
    landmark(results);
}

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    },
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
});

hands.onResults(execution);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: cameraWidth,
    height: cameraHeight,
});

camera.start();