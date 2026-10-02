import { LocalDate } from '@asset-sg/shared/v2';
import { DatePipe } from './date';

describe(DatePipe, () => {
  const pipe = new DatePipe();

  it('formats a LocalDate', () => {
    expect(pipe.transform(LocalDate.of(2024, 3, 4))).toEqual('2024-03-04');
  });

  it('formats a Date', () => {
    expect(pipe.transform(new Date(2024, 2, 4))).toEqual('2024-03-04');
  });

  it.each([null, undefined])('returns an empty string for %s', (value) => {
    expect(pipe.transform(value)).toEqual('');
  });
});
