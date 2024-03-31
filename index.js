const { spawn } = require('child_process');
const fs = require('fs');
const dotenv = require('dotenv').config();

process.chdir(__dirname);

const genAI = require("./src/ai")
const genVideo = require("./src/video")
const genAudio = require("./src/audio");
const ffmpeg = require('fluent-ffmpeg');
let _OverrideIdea
let _LatestOutputs = false
let _OverrideAudio = false


// ----------------------- VIDEO GLOBAL CONFIG -----------------------


_LatestOutputs = true
_OverrideAudio = true

_OverrideIdea = {
    Idea: 'Create a custom function to reverse a string without using the built-in reverse method.',
    CorrectCode: 'function reverseString(str) {\n' +
        "  let reversed = '';\n" +
        '  for (let i = str.length - 1; i >= 0; i--) {\n' +
        '    reversed += str[i];\n' +
        '  }\n' +
        '  return reversed;\n' +
        '}',
    BugIdea: '1. Incorrectly incrementing instead of decrementing in the loop, 2. Starting loop at str.length instead of str.length - 1, 3. Using str.length in the condition instead of >= 0, 4. Returning the original string instead of the reversed, 5. Concatenating in the wrong order resulting in the original string, 6. Trying to use a non-existing built-in method thinking it would reverse, 7. Declaring reversed as an array and forgetting to join it back into a string, 8. Using const for reversed variable, causing errors when trying to modify it, 9. Loop counter going out of bounds, 10. Subtracting 1 twice, once in the initialization, and again in the loop body, making it skip the first character. After considering these, the choice of initializing the loop at str.length, which will lead to an undefined addition at the first concatenation adding an interesting and hard-to-spot bug, was made.',
    Code: 'function reverseString(str) {\n' +
        "  let reversed = '';\n" +
        '  for (let i = str.length; i >= 0; i--) {\n' +
        '    reversed += str[i];\n' +
        '  }\n' +
        '  return reversed;\n' +
        '}',
    Script: "By initializing the loop with str.length, it attempts to access an out-of-bounds character, adding undefined to the beginning of our reversed string, a sneaky bug that's hard to spot without careful analysis."
}

music = [
    `./src/assets/music/1.mp3`,
    `./src/assets/music/2.mp3`,
]

// ----------------------- END VIDEO CONFIG -----------------------

const framerate = 30

function createOutputPipe(path) {
    return spawn('ffmpeg', [
        '-f', 'image2pipe',
        '-framerate', framerate,
        '-i', '-',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-filter:v', `fps=fps=${framerate}`,
        '-preset', 'veryfast',
        path
    ]);
}
function createFinalVideo(path, videoPath, musicPath, videoLength, audioPath, audioOffset, audioPath2, audioOffset2) {
    // ffmpeg -i video.mp4 -i audio.wav -c:v copy -c:a aac output.mp4
    options = [
        '-i', videoPath,
        '-i', audioPath,
        '-i', audioPath2,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-filter_complex', `[1:a]adelay=${audioOffset * 1000}|${audioOffset * 1000}[a1]; [2:a]adelay=${audioOffset2 * 1000}|${audioOffset2 * 1000}[a2]; [a1][a2]amix=inputs=2[a]`,
        '-map', '0',
        '-map', '[a]',
        path
    ]
    return spawn('ffmpeg', options);
}

async function getMediaDuration(path) {
    return new Promise((res, rej) => {
        ffmpeg.ffprobe(path, (err, metadata) => {
            if (!err) {
                res(metadata.format.duration)
            } else {
                rej(err)
            }
        })
    })
}

async function createVideo() {
    let videoIdea = _OverrideIdea

    console.log("\n-- Video Starting --")

    if (!videoIdea) {
        console.log("\nStarting AI idea generation...")
        videoIdea = await genAI()
        console.log("AI idea output:", videoIdea)
        console.log("AI idea complete.")
    } else {
        console.log("\nUsing override video idea.")
    }

    let videoCode = videoIdea["Code"]
    let videoScript = videoIdea["Script"]
    if (!videoCode || !videoScript) {
        return console.log("Video idea missing code or script:", videoCode, videoScript)
    }

    // let tasks = []

    let pathIdentity = Date.now().toString().slice(4, -2)

    let startAudioPath = `./src/assets/spot_the_bug.mp3`

    let audioPath = `./output/audio/complete-${pathIdentity}.mp3`
    let latestAudioPath = `./output/audio/complete-latest.mp3`
    // tasks.push(genAudio(audioPath, videoScript))
    let audioDuration2 = 0;
    if (_OverrideAudio) {
        audioPath = latestAudioPath
    } else {
        console.log("\nStarting audio generation...")
        await genAudio(audioPath, videoScript)
        if (_LatestOutputs) {
            fs.copyFileSync(audioPath, latestAudioPath)
        }
    }
    audioDuration2 = await getMediaDuration(audioPath)
    let audioDuration = await getMediaDuration(startAudioPath)
    console.log("Audio generation complete.")
    console.log("Audio lengths", audioDuration, audioDuration2)

    let videoPath = `./output/video/complete-${pathIdentity}.mp4`
    let latestVideoPath = `./output/video/complete-latest.mp4`
    let ffmpegPipe = createOutputPipe(videoPath, framerate)
    // tasks.push(genVideo(__dirname, ffmpegPipe.stdin, framerate, videoCode + "\n\n" + videoCorrectCode))
    console.log("\nStarting video generation...")
    let videoData = await genVideo(__dirname, ffmpegPipe.stdin, framerate, audioDuration, audioDuration2, videoIdea)
    console.log(videoData)
    await new Promise((res, rej) => {
        ffmpegPipe.on("exit", () => {
            if (_LatestOutputs) {
                let exists = fs.existsSync(videoPath)
                if (exists) {
                    fs.copyFileSync(videoPath, latestVideoPath)
                } else {
                    console.log("Video copy error, most likely threw error while rendering.")
                    return rej()
                }
            }
            res()
        })
    }).catch(e => {
        return console.log("Video render error", videoPath, audioPath, e)
    })

    console.log("Video generation complete.")


    console.log("\nStarting compilation...")

    let musicPath = music[Math.ceil(Math.random() * music.length) - 1]

    let finalPath = `./output/final/complete-${pathIdentity}.mp4`
    let latestFinalPath = `./output/final/complete-latest.mp4`
    let outputFfmpeg = createFinalVideo(finalPath, videoPath, startAudioPath, videoData["audioDelay"], audioPath, videoData["audioDelay2"])
    outputFfmpeg.stdout.on("data", (e) => {
        console.log("DATA", e)
    })
    await new Promise((res, rej) => {
        outputFfmpeg.on("exit", () => {
            if (_LatestOutputs) {
                let exists = fs.existsSync(finalPath)
                if (exists) {
                    fs.copyFileSync(finalPath, latestFinalPath)
                } else {
                    console.log("Final copy error, most likely threw error while compiling.")
                    return rej("File doesnt exist:" + finalPath)
                }
            }
            res()
        })
    }).catch(e => {
        return console.log("Final compile error", videoPath, audioPath, finalPath, e)
    })
    console.log("Video compilation complete.")

    console.log("-- Video Complete --\n")
}

createVideo()





// async function execCommand(command) {
//     await new Promise((res, rej) => {
//         exec(command, (error, stdout, stderr) => {
//             console.log("command response", error)
//             if (error) {
//                 console.error(`exec error: ${error}`);
//                 return rej(error);
//             }
//             // console.log(`stdout: ${stdout}`);
//             // console.error(`stderr: ${stderr}`);
//             res()
//         })
//     });
// }