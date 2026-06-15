import { sanitizeTextForJson } from './sanitize';

describe('sanitizeTextForJson', () => {
  it('should remove null characters', () => {
    expect(sanitizeTextForJson('hello\u0000world')).toBe('helloworld');
  });

  it('should remove lone surrogates', () => {
    expect(sanitizeTextForJson('text\uD800more')).toBe('textmore');
    expect(sanitizeTextForJson('text\uDBFFmore')).toBe('textmore');
    expect(sanitizeTextForJson('text\uDC00more')).toBe('textmore');
    expect(sanitizeTextForJson('text\uDFFFmore')).toBe('textmore');
  });

  it('should preserve normal text', () => {
    expect(sanitizeTextForJson('Hello, World!')).toBe('Hello, World!');
  });

  it('should preserve valid Unicode characters', () => {
    expect(sanitizeTextForJson('Ähren über Ähren')).toBe('Ähren über Ähren');
    expect(sanitizeTextForJson('日本語テスト')).toBe('日本語テスト');
  });

  it('should preserve whitespace characters', () => {
    expect(sanitizeTextForJson('hello\n\tworld')).toBe('hello\n\tworld');
  });

  it('should handle empty string', () => {
    expect(sanitizeTextForJson('')).toBe('');
  });

  it('should handle string with only invalid characters', () => {
    expect(sanitizeTextForJson('\u0000\uD800\uDFFF')).toBe('');
  });
});
