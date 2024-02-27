const video = document.getElementById("video")

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
    faceapi.nets.faceExpressionNet.loadFromUri("./models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
    faceapi.nets.ssdMobilenetv1.loadFromUri("./models")
]).then(startvideo()).then(getLabeledImgs)

function startvideo(){
    alert("models loaded")
    navigator.getUserMedia= navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia

    navigator.getUserMedia(
        {video : {}},
        stream => video.srcObject = stream,
        error => console.log(error)
    )
}

video.addEventListener("play",async ()=>{
    const labeledFaceDescriptors = await getLabeledImgs()
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors)
    


    const canvas = faceapi.createCanvasFromMedia(video)
    document.body.append(canvas)
    console.log("run")
    const displaySize = {
        width : video.width, height : video.height
    }
    faceapi.matchDimensions(canvas, displaySize)


    

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors().withFaceExpressions()
        const resizedDetections = faceapi.resizeResults(detections, displaySize)

        const results = resizedDetections.map(d => {
            return faceMatcher.findBestMatch(d.descriptor)
        })
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)
        results.forEach((result, i) =>{
            const box = resizedDetections[i].detection.box
            const drawbox = new faceapi.draw.DrawBox(box, {label : result})
            drawbox.draw(canvas) 
        })
        
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)

    }, 100);
})


function getLabeledImgs(){
    // labels = ["Mike Tyson", "Asylkhan", "Conor", "AdilShiz", "Aslan", "Batyr", "Dias", "Kaifarik", "Musrik", "PHP eber", "RomanPedik", "Sara", "Vadya", "Yelnur"]
    
    return Promise.all(
        labels.map(async label =>{
            const descriptions = []
            for (let i = 1; i <= 3; i++){
                const img = await faceapi.fetchImage(`./img/${label}/${i}.jpg`)
                const detections =await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
                descriptions.push(detections.descriptor)

            }
            return new faceapi.LabeledFaceDescriptors(label, descriptions)
        })
    )
}

// video.addEventListener('play', () => {
//   const canvas = faceapi.createCanvasFromMedia(video)
//   document.body.append(canvas)
//   const displaySize = { width: video.width, height: video.height }
//   faceapi.matchDimensions(canvas, displaySize)
//   setInterval(async () => {
//     const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
//     const resizedDetections = faceapi.resizeResults(detections, displaySize)
//     const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))

//     results.forEach((result, i) => {
//       const box = resizedDetections[i].detection.box
//       const drawBox = new faceapi.draw.DrawBox(box, {label: result.toString()})
//       drawBox.draw(canvas)
//     })

//     // canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
//     // faceapi.draw.drawDetections(canvas, resizedDetections)
//     // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
//     // faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
  
//   }, 100)
// })