const countWords = (text: string): number => text.split(/\s+/).length;

/**
 * Heading detection for paragraph-sized units extracted from PDF/DOCX.
 * Structured titles: markdown ("## Results"), relaxed ALL-CAPS
 * ("CONCLUSION."), numbered ("1. Introduction", "2.1 Background") and
 * named sections ("Chapter 3: Methods", "Appendix A").
 */
const isStructuredHeader = (paragraph: string): boolean => {
  const t = paragraph.trim();
  if (!t) return false;

  // Markdown headings: "# Title" ... "###### Title"
  if (/^#{1,6}\s+\S/.test(t)) return true;

  // Relaxed ALL-CAPS headings, trailing punctuation allowed: "CONCLUSION."
  if (
    t.length <= 80 &&
    countWords(t) <= 12 &&
    !/[a-z]/.test(t) &&
    /[A-Z]/.test(t) &&
    /^[A-Z0-9\s.,:;'"()&/!?-]+$/.test(t)
  ) {
    return true;
  }

  // Headings are titles, not sentences: short and no terminal punctuation.
  if (countWords(t) > 12 || /[.!?,;:)"'\]]$/.test(t)) return false;

  // Numbered headings: "1. Introduction", "2.1 Background", "3) Results"
  if (/^\d+(\.\d+)*[.)]?\s+\S/.test(t)) return true;

  // Named sections: "Chapter 3: Methods", "Section 2.1 Results", "Appendix A"
  return /^(chapter|section|part|appendix|figure|table|lesson|unit|module)\s+([\d.]+|[IVXLC]+|[A-Z])\b/i.test(
    t,
  );
};

/**
 * A paragraph that must never be the LAST paragraph of a chunk: structured
 * headings plus unstructured title-style lines ("Conclusion", "Results and
 * Discussion") — short and not ending a sentence. Letting one trail a chunk
 * is exactly how the next section's title leaked into the previous chunk.
 */
const isHeadingLike = (paragraph: string): boolean => {
  const t = paragraph.trim();
  if (!t) return false;
  if (isStructuredHeader(t)) return true;
  return countWords(t) <= 12 && !/[.!?,;:)"'\]]$/.test(t);
};

export const textUtilities = {
  textChunker(text: string) {
    const paragraphs: string[] = text.split(/\n\s*\n/);
    let chunkArray: string[] = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const current = paragraphs[i] as string;
      const trimmed = current.trim();
      if (!trimmed) continue;

      const wordCount = trimmed.split(/\s+/).length;

      if (wordCount < 150 && i + 1 < paragraphs.length) {
        const next = paragraphs[i + 1] as string;
        paragraphs[i + 1] = trimmed + ' ' + next.trim();
        continue;
      }

      if (wordCount <= 400) {
        chunkArray.push(paragraphs[i] as string);
        continue;
      } else {
        const sentenceRegex =
          /(?<!\b(?:Dr|Mr|Mrs|Ms|Sr|Jr|St|e\.g|i\.e)\.)(?<=[.!?])\s+/i;
        const sentences = (paragraphs[i] as string).split(sentenceRegex);
        let sentenceChunk: string[] = [];
        let runningCount = 0;

        sentences.forEach((s) => {
          const wordCount = s.split(/\s+/).length;
          runningCount += wordCount;
          sentenceChunk.push(s);

          if (runningCount >= 400) {
            chunkArray.push(sentenceChunk.join(' '));
            sentenceChunk = [];
            runningCount = 0;
          }
        });

        if (sentenceChunk.length > 0) {
          chunkArray.push(sentenceChunk.join(' '));
        }
      }
    }

    return chunkArray;
  },

  seniorChunker(text: string, minWords = 150, maxWords = 450) {
    // 1. Clean and split into base units (paragraphs)
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim() !== '');
    const chunks: string[] = [];

    let buffer: string[] = [];
    let bufferWordCount = 0;

    // Seal the buffered paragraphs as a chunk. A heading-like paragraph is
    // held back so no chunk ever ENDS with the next section's title — it
    // becomes the first paragraph of the following chunk instead.
    const sealBuffer = (): void => {
      let end = buffer.length;
      if (end > 1 && isHeadingLike(buffer[end - 1] as string)) end -= 1;
      const sealed = buffer.slice(0, end);
      const held = buffer.slice(end);
      if (sealed.length > 0) chunks.push(sealed.join('\n\n'));
      buffer = held;
      bufferWordCount = held.reduce((n, p) => n + countWords(p), 0);
    };

    // True when the buffer holds real body content (not just leftover title
    // lines), so tiny fragments are never flushed into a chunk of their own.
    const bufferHasBody = (): boolean => buffer.some((p) => !isHeadingLike(p));

    for (const p of paragraphs) {
      const pTrimmed = p.trim();
      const pWordCount = countWords(pTrimmed);

      // 2. Structural Break Check: is this a heading? Flush first so the
      // heading STARTS a new chunk instead of joining the previous section.
      if (isHeadingLike(pTrimmed) && buffer.length > 0 && bufferHasBody()) {
        sealBuffer();
      }

      // 3. Large Paragraph Handling: split paragraphs over maxWords by sentence
      if (pWordCount > maxWords) {
        if (bufferHasBody()) sealBuffer();

        const sentences = pTrimmed.split(
          /(?<!\b(?:Dr|Mr|Mrs|Ms|Sr|Jr|St|e\.g|i\.e)\.)(?<=[.!?])\s+/i,
        );
        // Any held-back title leads the split content that follows it
        let sBuffer: string[] = [...buffer];
        let sCount = bufferWordCount;
        buffer = [];
        bufferWordCount = 0;

        for (const s of sentences) {
          sBuffer.push(s);
          sCount += countWords(s);
          if (sCount >= minWords) {
            chunks.push(sBuffer.join(' '));
            sBuffer = [];
            sCount = 0;
          }
        }
        buffer = sBuffer; // Keep any leftover sentences for the next round
        bufferWordCount = sCount;
        continue;
      }

      // 4. Respect maxWords: seal BEFORE appending a paragraph that would
      // push this chunk past the cap (a single paragraph up to maxWords is
      // fine on its own; see the branch above). Skipped when the buffer is
      // only held-back titles — those lead the incoming paragraph instead
      // of being orphaned into a title-only chunk.
      if (
        bufferWordCount > 0 &&
        bufferHasBody() &&
        bufferWordCount + pWordCount > maxWords
      ) {
        sealBuffer();
      }

      // 5. Standard Accumulation
      buffer.push(pTrimmed);
      bufferWordCount += pWordCount;

      // If bucket is full enough, seal the chunk
      if (bufferWordCount >= minWords) {
        sealBuffer();
      }
    }

    // 6. Final Flush — nothing follows, so nothing needs holding back
    if (buffer.length > 0) chunks.push(buffer.join('\n\n'));

    return chunks;
  },

  cleanExtractedText(text: string) {
    return (
      text
        // 1. Remove "Displaced" Footers/Page numbers
        // This looks for "Page X of Y" or just "Page 1" patterns
        .replace(/Page\s?\d+(\s?of\s?\d+)?/gi, '')

        // 2. Fix "Split Words"
        // Sometimes "Example" becomes "Ex- ample" due to line breaks
        .replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')

        // 3. Fix sentence endings
        // Ensure exactly one space after sentence-ending punctuation —
        // without eating line/paragraph breaks (the old \s* swallowed \n\n
        // and collapsed the whole document into one paragraph) and without
        // breaking decimals ("2.1") or abbreviations ("e.g.", "i.e.")
        .replace(
          /([.!?])[ \t]*/g,
          (match: string, punct: string, offset: number, source: string) => {
            const before = source.slice(0, offset);
            const after = source.slice(offset + match.length);

            // Leave line and paragraph breaks intact
            if (
              after === '' ||
              after.startsWith('\n') ||
              after.startsWith('\r')
            ) {
              return punct;
            }
            // Keep stacked punctuation together: "?!", "!?"
            if (after.startsWith('?') || after.startsWith('!')) return match;
            // Decimals: "2.1"
            if (punct === '.' && /\d$/.test(before) && /^\d/.test(after)) {
              return match;
            }
            // Abbreviations: "e.g.", "i.e.", "U.S." (single letter before dot)
            if (punct === '.' && /(?:^|[^\w.])\w$/.test(before)) return match;

            return `${punct} `;
          },
        )

        .trim()
    );
  },

  cleanAiOutput(chunks: string[]) {
    return chunks.map((chunk) => chunk.replace(/\n+/g, ' ').trim());
  },

  countTokenEstimateFromString(text: string) {
    // return the number of token in a string
    return Math.ceil(text.length / 4);
  },
};
