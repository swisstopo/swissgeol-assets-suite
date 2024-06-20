import { NonError, deserializeError, isErrorLike, serializeError } from './serialize-error';

describe('serializeError', () => {
  it('should serialize error objects', () => {
    const error = new Error('Test error');
    const serialized = serializeError(error);
    expect(serialized).toHaveProperty('name', 'Error');
    expect(serialized).toHaveProperty('message', 'Test error');
    expect(serialized).toHaveProperty('stack');
  });

  it('should serialize non-error objects', () => {
    const obj = { key: 'value' };
    const serialized = serializeError(obj);
    expect(serialized).toEqual(obj);
  });

  it('should serialize primitive values', () => {
    expect(serializeError('test')).toBe('test');
    expect(serializeError(123)).toBe(123);
  });
});

describe('deserializeError', () => {
  it('should deserialize serialized error objects', () => {
    const error = new Error('Test error');
    const serialized = serializeError(error);
    const deserialized = deserializeError(serialized);
    expect(deserialized).toBeInstanceOf(Error);
    expect(deserialized.message).toBe('Test error');
  });

  it('should return NonError for non-error objects', () => {
    const obj = { key: 'value' };
    const deserialized = deserializeError(obj);
    expect(deserialized).toBeInstanceOf(NonError);
    expect(deserialized.message).toBe(JSON.stringify(obj));
  });

  it('should return NonError for primitive string', () => {
    const deserialized = deserializeError('test');
    expect(deserialized).toBeInstanceOf(NonError);
    expect(deserialized.message).toBe('"test"');
  });

  it('should return NonError for primitive number', () => {
    const deserialized = deserializeError(123);
    expect(deserialized).toBeInstanceOf(NonError);
    expect(deserialized.message).toBe('123');
  });
});

describe('isErrorLike', () => {
  it('should return true for error objects', () => {
    const error = new Error('Test error');
    expect(isErrorLike(error)).toBe(true);
  });

  it('should return false for non-error objects', () => {
    const obj = { key: 'value' };
    expect(isErrorLike(obj)).toBe(false);
  });

  it('should return false for primitive values', () => {
    expect(isErrorLike('test')).toBe(false);
    expect(isErrorLike(123)).toBe(false);
  });
});
