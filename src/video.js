const { createCanvas, registerFont, loadImage } = require('canvas');
const fs = require('fs');
// const { drawHighlightedCode, themes: highlightThemes } = require('canvas-syntax-highlight')
const { drawHighlightedCode } = require('./highlighter')

// --------------------- VIDEO GLOBAL CONFIG ---------------------

const startBuffer = 0.5
const startEndBuffer = 0.5
const countdownTime = 3
const countdownEndBuffer = 0.2
const endBufferTime = 1


//  VIDEO DETAILS
const gradientSpeed = [10, 20]
const gradientNum = 7

// --------------------- END VIDEO CONFIG ---------------------

module.exports = async (base, output, framerate, audioDuration, audioDuration2, idea) => {
    registerFont(base + '/src/fonts/FiraCode-Regular.ttf', { family: 'FiraCode' });

    let videoLength = startBuffer + audioDuration + startEndBuffer + countdownTime + countdownEndBuffer + audioDuration2 + endBufferTime
    const length = Math.round(videoLength * 10) / 10;
    const framenum = length * framerate;

    const width = 1080;
    const height = 1920;
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');

    const jsLogo = await loadImage(base + "/src/assets/js_logo.png")

    class BackgroundGradient {
        constructor() {

            let speed = Math.random() * (gradientSpeed[1] - gradientSpeed[0]) + gradientSpeed[0]
            // speed *= 2

            let min = width / 3
            this.rad = Math.round(Math.random() * (width / 2.5 - min) + min)

            this.x = Math.round(Math.random() * (width + this.rad * 2) - this.rad)
            this.y = Math.round(Math.random() * (height + this.rad * 2) - this.rad)

            let ang = Math.random() * 360
            this.xVel = Math.cos(ang) * speed
            this.yVel = Math.sin(ang) * speed

            // this.color = [Math.random() * 360, 100, 50]
            this.color = [0, 0, 60]
        }
        tick(progress) {
            this.x += this.xVel
            this.y += this.yVel
            if (this.x > width + this.rad || this.x < -this.rad) this.xVel *= -1
            if (this.y > height + this.rad || this.y < -this.rad) this.yVel *= -1
            // if (this.x > width || this.x < 0) this.xVel *= -1
            // if (this.y > height || this.y < 0) this.yVel *= -1
        }
    }

    let gridGradients = Array.from({ length: gradientNum }, () => new BackgroundGradient());

    let startRender = performance.now()
    let lastRender = startRender
    for (let i = 0; i < framenum; i++) {

        const circle = (x, y, rad, fill = "red", stroke = false, strokeWidth = 5) => {
            context.beginPath();
            context.arc(x, y, rad, 0, 2 * Math.PI, false);
            if (fill) {
                context.fillStyle = fill;
                context.fill()
            };
            if (stroke) {
                context.lineWidth = strokeWidth;
                context.strokeStyle = stroke;
                context.stroke()
            };
        }

        function drawRoundedRect(x, y, width, height, radius) {
            context.beginPath();
            context.moveTo(x + radius, y);
            context.lineTo(x + width - radius, y);
            context.quadraticCurveTo(x + width, y, x + width, y + radius);
            context.lineTo(x + width, y + height - radius);
            context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            context.lineTo(x + radius, y + height);
            context.quadraticCurveTo(x, y + height, x, y + height - radius);
            context.lineTo(x, y + radius);
            context.quadraticCurveTo(x, y, x + radius, y);
            context.closePath();
            context.fill();
            context.stroke();
        }

        function drawGrid(style, lineWidth = 4) {
            context.beginPath();
            for (let x = -10; x <= width; x += 50) {
                context.moveTo(x, 0);
                context.lineTo(x, height);
            }
            for (let y = -15; y <= height; y += 50) {
                context.moveTo(0, y);
                context.lineTo(width, y);
            }
            context.lineWidth = lineWidth;
            // context.strokeStyle = `hsla(${(progress * 360 * 2) % 360}, 100%, 80%, 0.8)`;
            context.strokeStyle = style;
            context.stroke();
        }

        function wrapText(text, x, y, maxWidth, lineHeight) {
            const words = text.split(' ');
            let line = '';
            let testLine, metrics;

            for (let n = 0; n < words.length; n++) {
                testLine = line + words[n] + ' ';
                metrics = context.measureText(testLine);
                if (metrics.width > maxWidth && n > 0) {
                    context.fillText(line, x, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            context.fillText(line, x, y);
        }


        let progress = i / framenum;


        context.fillStyle = '#040404';
        context.fillRect(0, 0, width, height);

        drawGrid("#242424")

        gridGradients.forEach(grad => {
            if (grad.tick) grad.tick()

            let gradient = context.createRadialGradient(grad.x, grad.y, 0, grad.x, grad.y, grad.rad);
            gradient.addColorStop(0, `hsla(${grad.color[0]}, ${grad.color[1]}%, ${grad.color[2]}%, 1)`);
            gradient.addColorStop(1, `hsla(${grad.color[0]}, ${grad.color[1]}%, ${grad.color[2]}%, 0)`);
            drawGrid(gradient)
        })

        context.fillStyle = '#171717';
        context.strokeStyle = '#aaa';
        context.lineWidth = 4;
        drawRoundedRect(width / 8, height / 10, width * 3 / 4, height * 4 / 5, 50);

        //         const codeSnippet = `function helloWorld() {
        //     console.log('Hello, world!'); 
        // }`;

        const textSettings = {
            fontFamily: 'FiraCode',
            fontSize: 40,
            lineHeight: 1.35,
            charWidth: 1.1,
            padding: 30,
        };

        context.font = `${textSettings.fontSize}px ${textSettings.fontFamily}`;
        context.fillStyle = "red"

        //         let rawCode = `const frame = canvas.toBuffer('image/jpeg');
        // output.write(frame)
        // let now = performance.now()

        // lastRender = now
        // const getNodeTokenClass = node => {
        // if (!node.attrs) {
        //     return 's'
        // }

        // const classNames = node.attrs.find(attr => attr.name === 'class')

        // return classNames && classNames.value
        //     ? classNames.value
        //     .split(' ')
        //     .slice(1)
        //     .join(' ')
        //     : ''
        // }

        // module.exports = getNodeTokenClass
        // `
        5
        let trimmedCode = idea['Code'].split("\n").reduce((prev, curr) => {
            prev += curr + "\n"
            return prev
        }, "")
        // console.log(trimmedCode)

        const codeStyle = {
            language: 'js',
            theme: 'customDark',
            code: trimmedCode
        }

        let titlePadding = 85
        // let titleText = "Spot_The_Bug.js"
        let titleText = "spotTheBug.js"
        // wrapText(codeSnippet, width / 8 + textSettings.padding, height / 10 + textSettings.padding + textSettings.lineHeight, width / 2 - (textSettings.padding * 2), textSettings.lineHeight);
        drawHighlightedCode(context, codeStyle, width / 8 + textSettings.padding, height / 10 + textSettings.padding + titlePadding + 5, textSettings.lineHeight, width * 3 / 4 - (textSettings.padding * 2))

        context.fillStyle = "white"
        let imageSize = 50
        context.fillText(titleText, width / 2 - context.measureText(titleText).width / 2 + imageSize / 2 + 9, height / 10 + titlePadding * 3 / 4)
        context.drawImage(jsLogo, width / 2 - imageSize / 2 - context.measureText(titleText).width / 2 - 11, height / 10 + titlePadding * 1 / 3.3, imageSize, imageSize)
        context.fillRect(width / 8, height / 10 + textSettings.padding + titlePadding * 0.85, width * 3 / 4, 2);

        // context.fillRect(width / 4, height / 2 + 100, width / 2, 100)
        // context.fillStyle = "red"
        // context.font = "80px sans-serif";
        // context.filter = "blur(25px)"
        // context.fillText("Hey there testing", width / 2 - context.measureText("Hey there testing").width / 2, height / 2)
        // context.fillRect(width / 4, height / 2 + 100, width / 2, 100)

        // Save each frame
        // const frame = canvas.toBuffer('image/png');
        const frame = canvas.toBuffer('image/jpeg');
        output.write(frame)
        let now = performance.now()
        console.log(`Frame ${i + 1}/${framenum} rendered in: ${Math.round(now - lastRender)}ms`)
        lastRender = now
    }

    const fullMs = Math.round(performance.now() - startRender)
    let fullS = Math.round(fullMs / 1000)
    const fullM = Math.floor(fullS / 60)
    console.log(`Video rendered in: ${fullMs}ms | ${fullM}m ${fullS % 60}s`)

    output.end();

    return { audioDelay: startBuffer, audioDelay2: startBuffer + audioDuration + startEndBuffer + countdownTime + countdownEndBuffer, totalDuration: length }
}

