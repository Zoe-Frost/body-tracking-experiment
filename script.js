const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const texture = document.getElementById("texture");

let segmentation;

// ✅ Resize canvas to full screen
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);

// 🎥 Setup camera
async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 }
  });

  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.play();
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

// 🎨 Draw everything (FULLSCREEN + MIRROR + TEXTURE)
function onResults(results) {
  const cw = canvas.width;
  const ch = canvas.height;

  const vw = results.image.width;
  const vh = results.image.height;

  // Scale to COVER screen
  const scale = Math.max(cw / vw, ch / vh);

  const drawWidth = vw * scale;
  const drawHeight = vh * scale;

  const offsetX = (cw - drawWidth) / 2;
  const offsetY = (ch - drawHeight) / 2;

  ctx.clearRect(0, 0, cw, ch);

  // ✅ MIRRORED CAMERA
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(
    results.image,
    -(drawWidth + offsetX),
    offsetY,
    drawWidth,
    drawHeight
  );
  ctx.restore();

  // ✅ Apply segmentation mask (also mirrored)
  ctx.save();
  ctx.scale(-1, 1);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(
    results.segmentationMask,
    -(drawWidth + offsetX),
    offsetY,
    drawWidth,
    drawHeight
  );
  ctx.restore();

  // ✅ Fill body with texture
  ctx.globalCompositeOperation = "source-in";
  ctx.drawImage(texture, 0, 0, cw, ch);

  // Reset
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

  resizeCanvas(); // ✅ FULLSCREEN FIX

  setupSegmentation();
  render();
}

start();