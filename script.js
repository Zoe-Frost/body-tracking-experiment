const video = document.getElementById("video")
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

let detector
let particles = []
let previousPositions = {}

// load graphics
const jointImg = new Image()
jointImg.src = "assets/joint.svg"

const glitchImg = new Image()
glitchImg.src = "assets/glitch-dot.svg"

// body skeleton connections
const skeleton = [
["left_shoulder","right_shoulder"],
["left_shoulder","left_elbow"],
["left_elbow","left_wrist"],
["right_shoulder","right_elbow"],
["right_elbow","right_wrist"],
["left_shoulder","left_hip"],
["right_shoulder","right_hip"],
["left_hip","right_hip"]
]

// particle class
class Particle{

constructor(x,y){

this.x = x
this.y = y

this.vx = (Math.random()-0.5)*6
this.vy = (Math.random()-0.5)*6

this.life = 80

}

update(){

this.x += this.vx
this.y += this.vy

this.vx *= 0.95
this.vy *= 0.95

this.life--

}

draw(){

ctx.globalAlpha = this.life/80

ctx.drawImage(glitchImg,this.x,this.y,12,12)

ctx.globalAlpha = 1

}

}

// setup webcam
async function setupCamera(){

const stream = await navigator.mediaDevices.getUserMedia({
video:true
})

video.srcObject = stream

return new Promise(resolve=>{
video.onloadedmetadata = ()=>{
resolve(video)
}
})

}

// main setup
async function init(){

await setupCamera()

canvas.width = video.videoWidth
canvas.height = video.videoHeight

detector = await poseDetection.createDetector(
poseDetection.SupportedModels.MoveNet
)

detect()

}

function drawJoint(x,y){

ctx.drawImage(
jointImg,
x-15,
y-15,
30,
30
)

}

// skeleton lines
function drawSkeleton(keypoints){

skeleton.forEach(pair=>{

let p1 = keypoints.find(p=>p.name === pair[0])
let p2 = keypoints.find(p=>p.name === pair[1])

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

// animation loop
async function detect(){

const poses = await detector.estimatePoses(video)

ctx.clearRect(0,0,canvas.width,canvas.height)

ctx.drawImage(video,0,0)

poses.forEach(pose=>{

drawSkeleton(pose.keypoints)

pose.keypoints.forEach(point=>{

if(point.score > 0.4){

drawJoint(point.x,point.y)

// movement detection
let prev = previousPositions[point.name]

if(prev){

let dx = point.x - prev.x
let dy = point.y - prev.y

let speed = Math.sqrt(dx*dx + dy*dy)

if(speed > 5){

for(let i=0;i<3;i++){
particles.push(new Particle(point.x,point.y))
}

}

}

previousPositions[point.name] = {
x:point.x,
y:point.y
}

}

})

})

// draw particles
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