// TO DO: PRACTICE CHUNKING LOGIC

export const textUtilities = {
  textChunker(text: string) {
    const paragraphs: string[] = text.split(/\n\s*\n/);
    let chunkArray: string[] = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const current = paragraphs[i] as string;
      const trimmed = current.trim();
      if (!trimmed) return;

      const wordCount = trimmed.split(/\s+/).length;

      if (wordCount < 250 && i + 1 < paragraphs.length) {
        const next = paragraphs[i + 1] as string;
        paragraphs[i + 1] = trimmed + ' ' + next.trim();
        continue;
      }

      if (wordCount <= 500) {
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
};
