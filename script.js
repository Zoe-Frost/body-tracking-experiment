const video = document.getElementById("video")
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

// 🔗 Define how body points connect
const connections = [
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],

  ["left_shoulder", "right_shoulder"],

  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],

  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"]
]

// 🎥 Setup camera
async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true
  })

  video.srcObject = stream

  return new Promise(resolve => {
    video.onloadedmetadata = () => resolve(video)
  })
}

// 🎯 Draw a joint (circle)
function drawJoint(x, y) {
  ctx.beginPath()
  ctx.arc(x, y, 10, 0, Math.PI * 2)
  ctx.fillStyle = "rgba(167, 181, 181, 0.8)"
  ctx.fill()
}

// 🔗 Draw line between joints
function drawLine(p1, p2) {
  ctx.beginPath()
  ctx.moveTo(p1.x, p1.y)
  ctx.lineTo(p2.x, p2.y)

  ctx.strokeStyle = "rgba(120, 193, 208, 0.5)"
  ctx.lineWidth = 8
  ctx.lineCap = "round"

  ctx.stroke()
}

// ⚡ Glitch effect
function drawGlitch(x, y) {
  ctx.fillStyle = "rgba(120, 193, 208, 0.3)"

  ctx.fillRect(
    x + (Math.random() - 0.5) * 30,
    y + (Math.random() - 0.5) * 30,
    40,
    15
  )
}

// 🚀 Main tracking
async function startTracking() {

  await setupCamera()

  // Match canvas to video
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  // ⚡ Faster model
  const detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
    }
  )

  async function detect() {

    const poses = await detector.estimatePoses(video)

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    poses.forEach(pose => {

      // 🧠 Convert keypoints into easy lookup
      const points = {}

      pose.keypoints.forEach(p => {
        if (p.score > 0.4) {
          points[p.name] = p
        }
      })

      // 🔗 Draw skeleton connections
      connections.forEach(([a, b]) => {
        if (points[a] && points[b]) {
          drawLine(points[a], points[b])
        }
      })

      // 🎯 Draw joints + glitch
      pose.keypoints.forEach(p => {
        if (p.score > 0.4) {
          drawJoint(p.x, p.y)
          drawGlitch(p.x, p.y)
        }
      })

    })

    requestAnimationFrame(detect)
  }

  detect()
}

// ▶️ Start everything
startTracking()