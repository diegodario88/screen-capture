const { desktopCapturer, remote } = require('electron')
const { writeFile } = require('fs')
const { Menu, dialog } = remote

let mediaRecorder

const recordedChunks = []
const video = document.querySelector('video')
const videoSelectBtn = document.getElementById('videoSelectBtn')
const stopButton = document.getElementById('stopBtn')
const startButton = document.getElementById('startBtn')

videoSelectBtn.onclick = getVideoSources

startButton.onclick = e => {
    mediaRecorder.start()
    startButton.classList.add('is-danger')
    startButton.innerText = 'Recording...'
}

stopButton.onclick = e => {
    mediaRecorder.stop()
    startButton.classList.remove('is-danger')
    startButton.innerText = 'Start'
}

function handleDataAvaliable(e) {
    console.log('video data avaliable');
    recordedChunks.push(e.data)
    console.log(recordedChunks);
    
}

async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
    })

    const buffer = Buffer.from(await blob.arrayBuffer())

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save Video',
        defaultPath: `vid-${Date.now()}.webm`
    })

    if (filePath) {

        writeFile(filePath, buffer, () => console.log('video saved successfully!'))
    }
}

async function selectSource(source) {
    videoSelectBtn.innerText = source.name

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)

    video.srcObject = stream
    video.play()

    const options = { mimeType: 'video/webm;  codecs=vp9' }

    mediaRecorder = new MediaRecorder(stream, options)

    mediaRecorder.ondataavailable = handleDataAvaliable
    mediaRecorder.onstop = handleStop
}

async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    })

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(item => {
            return {
                label: item.name,
                click: () => selectSource(item)
            }
        })
    )

    videoOptionsMenu.popup()
}

