const video = document.getElementById("video")
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

async function setupCamera(){

const stream = await navigator.mediaDevices.getUserMedia({
video:true
})

video.srcObject = stream

return new Promise(resolve=>{
video.onloadedmetadata=()=>{
resolve(video)
}
})

}

async function startTracking(){

await setupCamera()

canvas.width = video.videoWidth
canvas.height = video.videoHeight

const detector = await poseDetection.createDetector(
poseDetection.SupportedModels.MoveNet
)

function drawJoint(x,y){

ctx.beginPath()
ctx.arc(x,y,8,0,Math.PI*2)

ctx.fillStyle="cyan"
ctx.fill()

}

function drawGlitch(x,y){

ctx.fillStyle="rgba(255, 255, 255, 0.4)"

ctx.fillRect(
x + Math.random()*20 -10,
y + Math.random()*20 -10,
80,
3
)

}

async function detect(){

const poses = await detector.estimatePoses(video)

ctx.clearRect(0,0,canvas.width,canvas.height)

ctx.drawImage(video,0,0)

poses.forEach(pose=>{

pose.keypoints.forEach(point=>{

if(point.score > 0.4){

drawJoint(point.x,point.y)
drawGlitch(point.x,point.y)

}

})

})

requestAnimationFrame(detect)

}

detect()

}

startTracking()