const { spawn } = require('child_process');
const fs = require('fs');
const dotenv = require('dotenv').config();

process.chdir(__dirname);

const genAI = require("./src/ai")
const genVideo = require("./src/video")
const genAudio = require("./src/audio");
const ffmpeg = require('fluent-ffmpeg');
const uploadVideo = require('./src/youtube');
let _OverrideIdea
let _LatestOutputs = false
let _OverrideAudio = false
let _OverrideVideo = false
let _OverrideFinal = false
let _PostYoutube = true


// ----------------------- VIDEO GLOBAL CONFIG -----------------------

_LatestOutputs = true

// _PostYoutube = false

_OverrideFinal = true

// _OverrideAudio = true
// _OverrideVideo = { audioDelay: 0.5, audioDelay2: 6.18525, totalDuration: 19.1 }
// _OverrideVideo = { audioDelay: 0.5, audioDelay2: 6.18525, totalDuration: 15.8 }
// _OverrideIdea = {
//     Idea: 'Create a custom function to reverse a string without using the built-in reverse method.',
//     CorrectCode: 'function reverseString(str) {\n' +
//         "  let reversed = '';\n" +
//         '  for (let i = str.length - 1; i >= 0; i--) {\n' +
//         '    reversed += str[i];\n' +
//         '  }\n' +
//         '  return reversed;\n' +
//         '}',
//     BugIdea: '1. Incorrectly incrementing instead of decrementing in the loop, 2. Starting loop at str.length instead of str.length - 1, 3. Using str.length in the condition instead of >= 0, 4. Returning the original string instead of the reversed, 5. Concatenating in the wrong order resulting in the original string, 6. Trying to use a non-existing built-in method thinking it would reverse, 7. Declaring reversed as an array and forgetting to join it back into a string, 8. Using const for reversed variable, causing errors when trying to modify it, 9. Loop counter going out of bounds, 10. Subtracting 1 twice, once in the initialization, and again in the loop body, making it skip the first character. After considering these, the choice of initializing the loop at str.length, which will lead to an undefined addition at the first concatenation adding an interesting and hard-to-spot bug, was made.',
//     Code: 'function reverseString(str) {\n' +
//         "  let reversed = '';\n" +
//         '  for (let i = str.length; i >= 0; i--) {\n' +
//         '    reversed += str[i];\n' +
//         '  }\n' +
//         '  return reversed;\n' +
//         '}',
//     Script: "By initializing the loop with s-t-r dot length, it attempts to access an out-of-bounds character, adding undefined to the beginning of our reversed string, a sneaky bug that's hard to spot without careful analysis."
// }
_OverrideIdea = {
    Idea: 'Develop a function that checks if a string is a palindrome.',
    CorrectCode: 'function isPalindrome(str) {\n' +
        '  let start = 0;\n' +
        '  let end = str.length - 1;\n' +
        '  while (start < end) {\n' +
        '    if (str.charAt(start) !== str.charAt(end)) {\n' +
        '      return false;\n' +
        '    }\n' +
        '    start++;\n' +
        '    end--;\n' +
        '  }\n' +
        '  return true;\n' +
        '}',
    BugIdea: "1. Use wrong comparison operator in if condition, resulting in always true. 2. Incorrectly incrementing 'end' instead of decrementing, causing an infinite loop. 3. Not converting the string to the same case, causing case-sensitive checks to fail. 4. Skip checking characters and only compare the first and last one. 5. Initialize 'start' and 'end' with wrong values, causing early termination. 6. Return true inside the loop, leading to incorrect early positive results. 7. Forgetting to update 'start' or 'end' inside the loop, leading to an infinite loop. 8. Wrongly using str.length in comparison instead of actual indices. 9. Using '===' without considering type conversion for characters. 10. Misusing .charAt() with incorrect indexes. Decision: Not converting the string to the same case adds a non-obvious layer of complexity and engages understanding around case sensitivity in string comparison.",
    Code: 'function isPalindrome(str) {\n' +
        '  let start = 0;\n' +
        '  let end = str.length - 1;\n' +
        '  while (start < end) {\n' +
        '    if (str.charAt(start) !== str.charAt(end)) {\n' +
        '      return false;\n' +
        '    }\n' +
        '    start++;\n' +
        '  }\n' +
        '  return true;\n' +
        '}',
    Script: "Our bug? The function's logic never decreases the end variable. This will cause all character checks to be paired incorrectly, causing a failure."
}

_MusicList = [
    [`./src/assets/music/pharoah-tatami.mp3`, `Music from #Uppbeat (free for Creators!):
    https://uppbeat.io/t/tatami/pharoah
    License code: TZKO4CXQKBNKGDTG`],
    [`./src/assets/music/aurora-jeff-kaale.mp3`, `Music from #Uppbeat (free for Creators!):
    https://uppbeat.io/t/jeff-kaale/aurora
    License code: V8EMPFMUKF8ADLMZ`],
    [`./src/assets/music/gravity-aavirall.mp3`, `Music from #Uppbeat (free for Creators!):
    https://uppbeat.io/t/aavirall/gravity
    License code: 6DYSSVM1SWNIKW5V`],
    [`./src/assets/music/you-wish-dread-pitt.mp3`, `Music from #Uppbeat (free for Creators!):
    https://uppbeat.io/t/dread-pitt/you-wish
    License code: JFKILOYJFBAISPBB`],
    [`./src/assets/music/born-with-it-sensho.mp3`, `Music from #Uppbeat (free for Creators!):
    https://uppbeat.io/t/sensho/born-with-it
    License code: F5B6JQRWZOEIHCGZ`],
    // [`./src/assets/music/.mp3`, ``],
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
function createFinalVideo(path, videoPath, musicPath, totalDuration, audioPath, audioOffset, audioPath2, audioOffset2) {
    // ffmpeg -i video.mp4 -i audio.wav -c:v copy -c:a aac output.mp4
    console.log(audioPath2, audioOffset2 * 1000)
    options = [
        '-i', videoPath,
        '-i', audioPath,
        '-i', audioPath2,
        '-i', musicPath,
        '-filter_complex', `[3:a]volume=0.15,afade=t=in:d=1,afade=t=out:st=${totalDuration - 1.5}:d=1.5[music]; [1:a]adelay=${audioOffset * 1000}|${audioOffset * 1000}[a1]; [2:a]adelay=${audioOffset2 * 1000}|${audioOffset2 * 1000}[a2]; [a1][a2]amix=inputs=2[a]; [a][music]amix=inputs=2[final]`,
        // '-filter_complex', `[1]adelay=${audioOffset * 1000}|${audioOffset * 1000}[a1]; [2]adelay=${audioOffset2 * 1000}|${audioOffset2 * 1000}[a2]; [a1][a2]amix=inputs=2:duration=first[a];`,
        // '-filter_complex', `[1]adelay=${audioOffset * 1000}|${audioOffset * 1000}[a1]; [2]adelay=${audioOffset2 * 1000}|${audioOffset2 * 1000}[a2]; [a1][a2]amix=inputs=2[a];`,
        '-map', '0:v',
        '-map', '[final]:a',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-t', totalDuration,
        '-y',
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

    let musicSelection = _MusicList[Math.ceil(Math.random() * _MusicList.length) - 1]
    let musicPath = musicSelection[0]
    let musicCredits = musicSelection[1]

    let startAudioPath = `./src/assets/spot_the_bug.mp3`

    let audioPath = `./output/audio/complete-${pathIdentity}.mp3`
    let latestAudioPath = `./output/audio/complete-latest.mp3`
    // tasks.push(genAudio(audioPath, videoScript))
    let audioDuration2 = 0;
    if (_OverrideAudio || _OverrideFinal) {
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
    console.log("Audio lengths", audioDuration, audioDuration2)
    console.log("Audio generation complete.")

    let videoPath = `./output/video/complete-${pathIdentity}.mp4`
    let latestVideoPath = `./output/video/complete-latest.mp4`
    let videoData
    if (_OverrideVideo || _OverrideFinal) {
        videoPath = latestVideoPath
        videoData = _OverrideVideo
        console.log(videoData)
    } else {
        let ffmpegPipe = createOutputPipe(videoPath, framerate)
        // tasks.push(genVideo(__dirname, ffmpegPipe.stdin, framerate, videoCode + "\n\n" + videoCorrectCode))
        console.log("\nStarting video generation...")
        videoData = await genVideo(__dirname, ffmpegPipe.stdin, framerate, audioDuration, audioDuration2, videoIdea)
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
    }

    console.log("Video generation complete.")


    console.log("\nStarting compilation...")



    let finalPath = `./output/final/complete-${pathIdentity}.mp4`
    let latestFinalPath = `./output/final/complete-latest.mp4`
    if (_OverrideFinal) {
        finalPath = latestFinalPath
    } else {
        let outputFfmpeg = createFinalVideo(finalPath, videoPath, musicPath, videoData["totalDuration"], startAudioPath, videoData["audioDelay"], audioPath, videoData["audioDelay2"])
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
    }
    console.log("Video compilation complete.", finalPath)

    let postTitle = `Can you spot the bug in the code? #shorts`
    let postDescription = `Spot the bug in the Javascript code! #coding #codechallenge #shorts\n\n${musicCredits}`
    let postTags = ["Coding", "Programming", "Code Challenge"]

    console.log("Post Details", postTitle)
    console.log("Title:", postTitle)
    console.log("Descr:", postDescription)
    console.log("Tags:", JSON.stringify(postTags))

    if (_PostYoutube) {
        console.log("\nStarting Youtube upload...")
        let uploadData = await uploadVideo(finalPath, postTitle, postDescription, postTags)
        console.log("Youtube upload complete.", `https://www.youtube.com/shorts/${uploadData.id}`)
    }

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