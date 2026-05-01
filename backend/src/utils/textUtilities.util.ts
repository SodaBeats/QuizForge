import tiktoken from 'tiktoken';

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

  seniorChunker(text: string, minWords = 200, maxWords = 500) {
    // 1. Clean and split into base units (paragraphs)
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim() !== '');
    const chunks: string[] = [];

    let buffer: string[] = [];
    let bufferWordCount = 0;

    for (const p of paragraphs) {
      const pTrimmed = p.trim();
      const pWordCount = pTrimmed.split(/\s+/).length;

      // 2. Structural Break Check: Is this a Header?
      // Logic: If it's a header, flush the buffer immediately to keep topics separate.
      const isHeader =
        /^[A-Z0-9\s]{5,50}$/.test(pTrimmed) || pTrimmed.startsWith('#');
      if (isHeader && buffer.length > 0) {
        chunks.push(buffer.join('\n\n'));
        buffer = [];
        bufferWordCount = 0;
      }

      // 3. Large Paragraph Handling: If a single paragraph is too big, split it
      if (pWordCount > maxWords) {
        // Flush anything currently in the buffer first
        if (buffer.length > 0) chunks.push(buffer.join('\n\n'));

        const sentences = pTrimmed.split(
          /(?<!\b(?:Dr|Mr|Mrs|Ms|Sr|Jr|St|e\.g|i\.e)\.)(?<=[.!?])\s+/i,
        );
        let sBuffer: string[] = [];
        let sCount = 0;

        for (const s of sentences) {
          sBuffer.push(s);
          sCount += s.split(/\s+/).length;
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

      // 4. Standard Accumulation
      buffer.push(pTrimmed);
      bufferWordCount += pWordCount;

      // If bucket is full enough, seal the chunk
      if (bufferWordCount >= minWords) {
        chunks.push(buffer.join('\n\n'));
        buffer = [];
        bufferWordCount = 0;
      }
    }

    // 5. Final Flush
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

        // 4. Fix sentence endings
        // Ensures there is exactly one space after a period/question mark
        .replace(/([.!?])\s*/g, '$1 ')

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
