import { isExpectedCancellationError, PdfLoadSupersededError } from './pdf-viewer.models';

describe('isExpectedCancellationError', () => {
  it.each(['RenderingCancelledException', 'AbortException'])('treats a %s error as expected', (name) => {
    const error = new Error('cancelled');
    error.name = name;
    expect(isExpectedCancellationError(error)).toBe(true);
  });

  it('treats PdfLoadSupersededError as expected', () => {
    expect(isExpectedCancellationError(new PdfLoadSupersededError())).toBe(true);
  });

  it('does not treat a genuine error as expected', () => {
    expect(isExpectedCancellationError(new Error('Network error'))).toBe(false);
  });
});
