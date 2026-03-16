const video = document.getElementById("video")
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

let detector
let particles = []

const jointImg = new Image()
jointImg.src = "assets/joint.svg"

// skeleton structure
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

// simple particle
class Particle{

constructor(x,y){

this.x = x
this.y = y
this.vx = (Math.random()-0.5)*3
this.vy = (Math.random()-0.5)*3
this.life = 40

}

update(){

this.x += this.vx
this.y += this.vy
this.life--

}

draw(){

ctx.globalAlpha = this.life/40
ctx.fillStyle="cyan"
ctx.fillRect(this.x,this.y,2,2)
ctx.globalAlpha = 1

}

}

// webcam setup
async function setupCamera(){

const stream = await navigator.mediaDevices.getUserMedia({
video:{
width:480,
height:360
}
})

video.srcObject = stream

return new Promise(resolve=>{
video.onloadedmetadata = ()=>{
resolve(video)
}
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

// draw skeleton
function drawSkeleton(points){

skeleton.forEach(pair=>{

let p1 = points.find(p=>p.name === pair[0])
let p2 = points.find(p=>p.name === pair[1])

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

// main loop
async function detect(){

const poses = await detector.estimatePoses(video)

ctx.clearRect(0,0,canvas.width,canvas.height)

ctx.drawImage(video,0,0)

poses.forEach(pose=>{

drawSkeleton(pose.keypoints)

pose.keypoints.forEach(point=>{

if(point.score > 0.4){

ctx.drawImage(jointImg,point.x-10,point.y-10,20,20)

// spawn small particles
if(particles.length < 80){
particles.push(new Particle(point.x,point.y))
}

}

})

})

// particles
particles.forEach((p,i)=>{

p.update()
p.draw()

if(p.life<=0){
particles.splice(i,1)
}

})

// slow detection slightly
setTimeout(()=>{
requestAnimationFrame(detect)
},40)

}

init()