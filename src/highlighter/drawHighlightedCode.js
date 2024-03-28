const parse5 = require('parse5')

const themes = require('./themes')
const highlightCode = require('./highlightCode')
const getNodeTokenClass = require('./getNodeTokenClass')

const drawHighlightedCode = (ctx, codeObject, x, y, lineHeight = 1, maxWidth = -1) => {
  const { code, language, theme = themes.dark } = codeObject

  const colors = typeof theme === 'string' ? themes[theme] : theme

  if (!colors) {
    throw new Error(`Theme "${theme}" not found`)
  }

  const htmlHighlightedCode = highlightCode(code, language).replace(/\n/g, '<br>')

  const parsedCode = parse5.parse(htmlHighlightedCode)
  const codeNodes = parsedCode.childNodes[0].childNodes[1].childNodes

  const fontSize = parseInt(ctx.font.match(/\d+/)[0]) || 10


  ctx.save()

  ctx.textBaseline = 'top'
  // ctx.textAlign = 'left'
  ctx.textAlign = 'right'

  let indent = 0
  let lineIndex = 0

  const forEachNodes = (nodes) => {
    nodes.forEach(node => {
      if (node.nodeName === 'br') {
        indent = 0
        lineIndex += 1

        return
      }


      if (node.childNodes) {
        forEachNodes(node.childNodes)
      }

      if (node.nodeName !== '#text') {
        return
      }

      ctx.globalAlpha = 1

      const text = node.value || ''
      const tokenClass = getNodeTokenClass(node.parentNode)
      const color = colors[tokenClass] || colors._default || '#000'
      if (typeof color === 'object') {
        if (color.opacity) {
          ctx.globalAlpha = color.opacity
        }
        if (color.color) {
          ctx.fillStyle = color
        }
      } else {
        ctx.fillStyle = color
      }


      const spaceWidth = ctx.measureText(" ").width
      const textWidth = ctx.measureText(text).width
      const textWidthTrimmed = ctx.measureText(text.trim()).width
      let firstCharInLine = indent === 0
      indent += textWidth

      // console.log(text, textWidth, indent, maxWidth, indent >= maxWidth)
      if (indent >= maxWidth && !firstCharInLine) {
        // console.log(text, textWidth, indent, maxWidth, indent >= maxWidth)
        indent = textWidthTrimmed + spaceWidth * 2;
        if (!text.trim().length) { //is a space
          indent = textWidthTrimmed;
        }
        lineIndex += 1

        ctx.fillText(text, x + indent, y + lineIndex * fontSize * lineHeight)

      } else {
        if (firstCharInLine) {
          // console.log(text, textWidth, indent, maxWidth, indent >= maxWidth)
        }
        // ctx.strokeStyle = "#fff"
        // ctx.lineWidth = 1
        // ctx.strokeRect(x, y + lineIndex * fontSize * lineHeight, maxWidth, 1)
        ctx.fillText(text, x + indent, y + lineIndex * fontSize * lineHeight)
      }


      // const words = text.split(' ');
      // let currentLine = '';

      // words.forEach((word, index) => {
      //   const testLine = currentLine + word + ' ';
      //   const lineWidth = ctx.measureText(testLine).width;

      //   if (maxWidth !== -1 && lineWidth > maxWidth && currentLine !== '') {
      //     ctx.fillText(currentLine, x + indent, y + lineIndex * fontSize * lineHeight);
      //     currentLine = word + ' ';
      //     lineIndex++;
      //   } else {
      //     currentLine = testLine;
      //   }

      //   if (index === words.length - 1 && currentLine !== '') {
      //     ctx.fillText(currentLine, x + indent, y + lineIndex * fontSize * lineHeight);
      //     const finalTextWidth = ctx.measureText(currentLine.slice(0, -1)).width;
      //     indent += finalTextWidth;
      //   }
      // });



      // let currentLine = ''; // Holds the text for the current line being processed.
      // let isFirstWordInLine = true; // Tracks if the next word is the first in a new line.

      // text.split(' ').forEach((word, index, wordsArray) => {
      //   const isLastWord = index === wordsArray.length - 1; // Check if it's the last word in the chunk.
      //   const wordWidth = ctx.measureText(word).width; // Measure the width of the current word.
      //   const spaceWidth = ctx.measureText(' ').width; // Measure the width of a space.

      //   let totalWidthWithWord;
      //   if (isFirstWordInLine) {
      //     totalWidthWithWord = wordWidth; // If it's the first word, consider only its width.
      //   } else {
      //     // Otherwise, add the width of the current line with a space and the word.
      //     totalWidthWithWord = ctx.measureText(currentLine + ' ' + word).width;
      //   }

      //   if (x + indent + totalWidthWithWord > maxWidth) {
      //     // If adding the word exceeds maxWidth, we need to handle a line break.
      //     if (currentLine.length > 0) {
      //       // Draw the current line if it has content.
      //       ctx.fillText(currentLine, x + indent, y + lineIndex * fontSize * lineHeight);
      //       lineIndex++; // Move to the next line.
      //     }

      //     if (wordWidth <= maxWidth) {
      //       // Start a new line with the current word if it fits within maxWidth.
      //       currentLine = word;
      //       isFirstWordInLine = false; // The next word will not be the first word in a line.
      //     } else {
      //       // If the word itself exceeds maxWidth, draw it anyway and move to the next line.
      //       ctx.fillText(word, x + indent, y + lineIndex * fontSize * lineHeight);
      //       lineIndex++;
      //       currentLine = ''; // Reset current line as we've moved to the next.
      //     }
      //     indent = 0; // Reset indent for the new line.
      //   } else {
      //     // If adding the word doesn't exceed maxWidth, add it to the current line.
      //     currentLine += (isFirstWordInLine ? '' : ' ') + word;
      //     isFirstWordInLine = false; // Update since we've added a word.
      //   }

      //   if (isLastWord && currentLine.length > 0) {
      //     // Handle the last word: draw the remaining text.
      //     ctx.fillText(currentLine, x + indent, y + lineIndex * fontSize * lineHeight);
      //     indent = ctx.measureText(currentLine).width; // Update indent for the next chunk.
      //     currentLine = ''; // Prepare for the next chunk.
      //     isFirstWordInLine = true; // Reset for the next chunk.
      //   }
      // });





      // Assuming these variables are defined and managed outside this function
      // let currentLineWidth = ctx.measureText(text).width;

      // // Split the chunk into words to check individual widths and manage wrapping
      // const words = text.split(' ');
      // let line = ''; // Initialize an empty line

      // words.forEach((word, index) => {
      //   const wordWidth = ctx.measureText(word + ' ').width; // Include space in width
      //   const linePlusWordWidth = ctx.measureText(line + word + ' ').width;

      //   if (x + indent + linePlusWordWidth > maxWidth && line !== '') {
      //     // If adding this word exceeds maxWidth, draw the current line and start a new one
      //     ctx.fillText(line, x + indent, y + lineIndex * fontSize * lineHeight);
      //     lineIndex++; // Move to the next line
      //     line = word + ' '; // Start the new line with the current word
      //     indent = 0; // Reset indent for all lines after the first
      //   } else {
      //     // Add the word to the current line
      //     line += word + ' ';
      //   }

      //   // Handle the last word in the chunk
      //   if (index === words.length - 1) {
      //     // Draw the remaining text
      //     ctx.fillText(line, x + indent, y + lineIndex * fontSize * lineHeight);
      //     // If this is the end of the chunk and it's not empty, prepare for the next chunk
      //     if (line.trim() !== '') {
      //       const lastLineWidth = ctx.measureText(line).width;
      //       // Only adjust indent if it's part of a continuous line
      //       if (currentLineWidth + lastLineWidth < maxWidth) {
      //         indent += lastLineWidth; // Adjust indent based on the last line width
      //       } else {
      //         // If we've just started a new line, reset indent accordingly
      //         indent = 0;
      //       }
      //     }
      //   }
      // });




    })
  }

  forEachNodes(codeNodes)

  ctx.restore()
}

module.exports = drawHighlightedCode

