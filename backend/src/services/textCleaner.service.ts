

export const cleanExtractedText = (text: string): string =>{

  return text
    // 1. Remove "Displaced" Footers/Page numbers
    // This looks for "Page X of Y" or just "Page 1" patterns
    .replace(/Page\s?\d+(\s?of\s?\d+)?/gi, '')

    // 2. Fix "Split Words" 
    // Sometimes "Example" becomes "Ex- ample" due to line breaks
    .replace(/(\w+)-\s+\n(\w+)/g, '$1$2')

    // 3. Normalize whitespace
    // Replaces multiple newlines/tabs/spaces with a single space
    //.replace(/\s+/g, ' ')

    // 4. Fix sentence endings
    // Ensures there is exactly one space after a period/question mark
    .replace(/([.!?])\s*/g, '$1 ')
    
    .trim();
};