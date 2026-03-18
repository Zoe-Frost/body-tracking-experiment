const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const texture = document.getElementById("texture"); // your image

let segmentation;

// 🎥 Setup canvas

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener("resize", resizeCanvas);
}

// 🎥 Setup camera

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 }
  });

  

  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.play();

      // Match canvas to video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      resolve();
    };
  });
   
}


// 🧠 Setup segmentation
function setupSegmentation() {
  segmentation = new SelfieSegmentation({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
  });

  segmentation.setOptions({
    modelSelection: 1
  });

  segmentation.onResults(onResults);
}

// 🎨 Draw everything
function onResults(results) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Draw camera FIRST (background)
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  // 2. Draw segmentation mask
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

  // 3. Replace body with image texture
  ctx.globalCompositeOperation = "source-in";

  ctx.drawImage(texture, 0, 0, canvas.width, canvas.height);

  // 4. Reset blend mode
  ctx.globalCompositeOperation = "source-over";
}

// 🔁 Loop
async function render() {
  await segmentation.send({ image: video });
  requestAnimationFrame(render);
}

// 🚀 Start everything
async function start() {
  await setupCamera();
  setupSegmentation();
  render();
}

start();