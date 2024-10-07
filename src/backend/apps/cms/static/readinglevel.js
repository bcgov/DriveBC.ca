/* The code below was copied and modified from
 * https://github.com/torchbox-forks/wagtail-readinglevel, per the terms of the
 * MIT licence that require inclusion of the copyright and licence itself
 * (below) in the source file.
 *
 * MIT License
 *
 * Copyright (c) 2017 vixdigital
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

function CalculateReadingLevel(text) {
  // Constants for our reading level calculation
  // These are part of the Automated Readability Index calculation
  // https://en.wikipedia.org/wiki/Automated_readability_index
  const CHARACTER_WEIGHT = 4.71;
  const SENTENCE_WEIGHT = 0.5;
  const BASE = 21.43;

  // Create the variables to hold the character, word and sentence counts
  let charCount = 0;
  let wordCount = 0;
  let sentenceCount = 0;

  const textClean = text.replace(/[^a-zA-Z ]/g, "");

  // Calculate the character count
  const textNoSpace = textClean.replace(/\s/g, "");
  const textNoPeriod = textNoSpace.replace(/\./g, "");
  charCount = textNoPeriod.length;

  // Calculate the word count -----------------
  const wordArray = textClean.split(" ");
  const wordArrayNoSpaces = wordArray.filter(v => v != '');
  wordCount = wordArrayNoSpaces.length;

  // Calculate the sentence count
  sentenceCount = (text.replace(/\S[.?!](\s|$)/g, "$1|").split("|").length) - 1;

  // If we have an empty first value in the array we know our text box is actually empty
  // so we need to minus 1 from our word count
  if (text.split(" ")[0] == "") {
    wordCount -= 1;
  }

  const readabilityScore = (CHARACTER_WEIGHT * (charCount / wordCount))
    + (SENTENCE_WEIGHT * (wordCount / sentenceCount)) - BASE;

  let readingAge = (readabilityScore + 4).toFixed(1);
  // Modify the help area to include the new information
  if (isFinite(readingAge)) {
    if (readingAge > 18) { readingAge = "18+" }
    else if (readingAge < 4) { readingAge = 4 }
    return {
      age: readingAge,
      score: readabilityScore,
      words: wordCount,
      sentences: sentenceCount
    };
  }
  else {
    return null;
  }
}

/*
 * A  control that displays the reading age of the content inside this rich text field.
 * Uses the Automated Readability Index to calculate.
 */
const ReadingLevel = ({ getEditorState }) => {
  const text = getEditorState().getCurrentContent().getPlainText();
  const stats = CalculateReadingLevel(text);

  let message = "Reading Age: N/A";

  const elem = 'div';
  const classNames = 'w-inline-block w-tabular-nums w-help-text w-mr-4';

  if (!stats) {
    return window.React.createElement(elem, { className: classNames }, `${message}`);
  }

  message = `Reading age: ${stats.age} years (score: ${stats.score.toFixed(1)})`;

  return window.React.createElement(elem, { className: classNames }, message);
}

window.draftail.registerPlugin({
  type: 'readinglevel',
  meta: ReadingLevel,
}, 'controls');