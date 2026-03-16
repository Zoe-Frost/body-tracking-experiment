const video = document.getElementById("video")
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

let detector
let particles = []
let ghostFrames = []

// load graphics
const jointImg = new Image()
jointImg.src = "assets/joint.svg"

const particleImg = new Image()
particleImg.src = "assets/particle.svg"

// skeleton connections
const skeleton = [
["left_shoulder","right_shoulder"],
["left_shoulder","left_elbow"],
["left_elbow","left_wrist"],
["right_shoulder","right_elbow"],
["right_elbow","right_wrist"],
["left_shoulder","left_hip"],
["right_shoulder","right_hip"],
["left_hip","right_hip"],
["left_hip","left_knee"],
["left_knee","left_ankle"],
["right_hip","right_knee"],
["right_knee","right_ankle"]
]

// particle class
class Particle{

constructor(x,y){

this.x = x
this.y = y

this.vx = (Math.random()-0.5)*5
this.vy = (Math.random()-0.5)*5

this.life = 60

}

update(){

this.x += this.vx
this.y += this.vy

this.vx *= 0.96
this.vy *= 0.96

this.life--

}

draw(){

ctx.globalAlpha = this.life/60

ctx.drawImage(particleImg,this.x,this.y,10,10)

ctx.globalAlpha = 1

}

}

// webcam setup
async function setupCamera(){

const stream = await navigator.mediaDevices.getUserMedia({
video:{
width:640,
height:480
}
})

video.srcObject = stream

return new Promise(resolve=>{
video.onloadedmetadata=()=>resolve(video)
})

}

// initialize
async function init(){

await setupCamera()

canvas.width = video.videoWidth
canvas.height = video.videoHeight

detector = await poseDetection.createDetector(
poseDetection.SupportedModels.MoveNet,
{
modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
}
)

detect()

}

// skeleton drawing
function drawSkeleton(keypoints){

skeleton.forEach(pair=>{

let p1 = keypoints.find(p=>p.name===pair[0])
let p2 = keypoints.find(p=>p.name===pair[1])

if(p1 && p2 && p1.score>0.4 && p2.score>0.4){

ctx.beginPath()
ctx.moveTo(p1.x,p1.y)
ctx.lineTo(p2.x,p2.y)

ctx.strokeStyle="cyan"
ctx.lineWidth=2
ctx.stroke()

}

})

}

// ghost trail effect
function drawGhosts(){

ghostFrames.forEach((frame,i)=>{

ctx.globalAlpha = i / ghostFrames.length * 0.4

ctx.drawImage(frame,0,0)

})

ctx.globalAlpha = 1

}

// detection loop
async function detect(){

const poses = await detector.estimatePoses(video)

ctx.clearRect(0,0,canvas.width,canvas.height)

// draw video
ctx.drawImage(video,0,0)

// store ghost frames
const ghostCanvas = document.createElement("canvas")
ghostCanvas.width = canvas.width
ghostCanvas.height = canvas.height

const gctx = ghostCanvas.getContext("2d")
gctx.drawImage(canvas,0,0)

ghostFrames.push(ghostCanvas)

if(ghostFrames.length > 8){
ghostFrames.shift()
}

// draw ghost trail
drawGhosts()

poses.forEach(pose=>{

drawSkeleton(pose.keypoints)

pose.keypoints.forEach(point=>{

if(point.score>0.4){

ctx.drawImage(jointImg,point.x-12,point.y-12,24,24)

// spawn particles
if(particles.length < 300){

particles.push(new Particle(point.x,point.y))

}

}

})

})

// update particles
particles.forEach((p,index)=>{

p.update()
p.draw()

if(p.life<=0){
particles.splice(index,1)
}

})

requestAnimationFrame(detect)

}

init()