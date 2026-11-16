import { textUtilities } from '../../utils/textUtilities.util.js';

const { seniorChunker, cleanExtractedText } = textUtilities;

/** An n-word filler paragraph: "tag1 tag2 ... tagn". */
const para = (n: number, tag: string): string =>
  Array.from({ length: n }, (_, i) => `${tag}${i + 1}`).join(' ');

const wordsIn = (text: string): number => text.split(/\s+/).length;

describe('seniorChunker', () => {
  it('never ends a chunk with the next section title', () => {
    const body1 = para(149, 'a');
    const body2 = para(200, 'b');

    // "Conclusion" is the paragraph that crosses the 150-word threshold;
    // it used to be sealed into the PREVIOUS section's chunk.
    const chunks = seniorChunker([body1, 'Conclusion', body2].join('\n\n'));

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toBe(body1);
    expect(chunks[1]).toBe(['Conclusion', body2].join('\n\n'));
  });

  it.each([
    ['ALL-CAPS', 'CONCLUSION'],
    ['numbered', '1. Introduction'],
    ['section-prefixed', 'Chapter 3: Methods'],
    ['markdown', '## Results'],
  ])(
    'breaks before a %s heading so the heading starts a new chunk',
    (_kind, heading) => {
      const body1 = para(100, 'a');
      const body2 = para(200, 'b');

      const chunks = seniorChunker([body1, heading, body2].join('\n\n'));

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toBe(body1);
      expect(chunks[1]).toBe([heading, body2].join('\n\n'));
    },
  );

  it('does not emit a chunk containing only headings', () => {
    const body1 = para(100, 'a');
    const body2 = para(200, 'b');

    const chunks = seniorChunker(
      [body1, 'PART I', 'CHAPTER 1', body2].join('\n\n'),
    );

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toBe(body1);
    expect(chunks[1]).toBe(['PART I', 'CHAPTER 1', body2].join('\n\n'));
  });

  it('keeps every chunk within maxWords', () => {
    const chunks = seniorChunker([para(149, 'a'), para(449, 'b')].join('\n\n'));

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toBe(para(149, 'a'));
    expect(chunks[1]).toBe(para(449, 'b'));
    expect(chunks.every((c) => wordsIn(c) <= 450)).toBe(true);
  });

  it('splits a paragraph larger than maxWords by sentence', () => {
    const big = Array.from(
      { length: 60 },
      (_, i) => `Sentence number ${i + 1} has some words in it.`,
    ).join(' ');

    const chunks = seniorChunker(big);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => wordsIn(c) <= 450)).toBe(true);
    expect(chunks.join(' ')).toContain('Sentence number 60');
  });

  it('keeps a heading attached to the large paragraph that follows it', () => {
    const body1 = para(100, 'a');
    const big = Array.from(
      { length: 70 },
      (_, i) => `Body sentence ${i + 1} carries some words along.`,
    ).join(' ');

    const chunks = seniorChunker([body1, 'METHODS', big].join('\n\n'));

    expect(chunks[0]).toBe(body1);
    // The heading leads the split content, it is never orphaned on its own
    expect(
      chunks.find((c) => c.includes('METHODS'))?.startsWith('METHODS'),
    ).toBe(true);
    expect(chunks.some((c) => c.split('\n\n').pop() === 'METHODS')).toBe(false);
  });

  it('returns no chunks for blank input', () => {
    expect(seniorChunker('')).toEqual([]);
    expect(seniorChunker(' \n\n  \n\n ')).toEqual([]);
  });

  it('keeps sections separate after cleanExtractedText (end to end)', () => {
    const doc = [para(149, 'a'), 'Conclusion', para(200, 'b')].join('\n\n');

    const chunks = seniorChunker(cleanExtractedText(doc));

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toBe(para(149, 'a'));
    expect(chunks[1]).toBe(['Conclusion', para(200, 'b')].join('\n\n'));
  });

  it('still separates paragraphs whose text ends with periods', () => {
    const doc =
      'First paragraph ends here.\n\n' +
      'Second paragraph continues the idea.\n\n' +
      'Third paragraph wraps it up.';

    const chunks = seniorChunker(cleanExtractedText(doc));

    expect(chunks).toEqual([doc]);
  });
});

describe('cleanExtractedText', () => {
  it('preserves paragraph breaks after sentence-ending punctuation', () => {
    const doc =
      'First paragraph ends here.\n\nSecond paragraph starts here.\n\nThird one too.';
    const cleaned = cleanExtractedText(doc);

    // The old \s*-based regex swallowed \n\n and collapsed this to one paragraph
    expect(cleaned.split(/\n\s*\n/)).toHaveLength(3);
    expect(cleaned).toContain('here.\n\nSecond');
  });

  it('does not corrupt decimals or abbreviations', () => {
    const cleaned = cleanExtractedText(
      'Section 2.1 covers e.g. this and i.e. that. Done.',
    );

    expect(cleaned).toContain('2.1');
    expect(cleaned).toContain('e.g.');
    expect(cleaned).toContain('i.e.');
    expect(cleaned).toContain('that. Done.');
  });

  it('inserts a missing space after sentence-ending punctuation', () => {
    expect(cleanExtractedText('Hello.World')).toBe('Hello. World');
    expect(cleanExtractedText('What?! Done')).toBe('What?! Done');
    expect(cleanExtractedText('Really?  Next')).toBe('Really? Next');
  });

  it('still removes page footers and rejoins hyphenated line breaks', () => {
    const cleaned = cleanExtractedText('Exam-\nple text on page 12 here.');

    expect(cleaned).toContain('Example');
    expect(cleaned).not.toContain('page 12');
  });
});
