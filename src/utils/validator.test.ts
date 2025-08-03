import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import fs from 'fs/promises';
import { validateInput } from './validator';

jest.mock('fs/promises');

describe('validateInput', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate a valid markdown file with default options', async () => {
    mockFs.access.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ isFile: () => true } as any);

    const result = await validateInput('test.md', {
      output: './images',
      format: 'png',
      quality: '85',
      scale: '2'
    });

    expect(result).toEqual({
      output: expect.stringContaining('images'),
      format: 'png',
      quality: 85,
      scale: 2,
      verbose: false
    });
  });

  it('should throw error for non-existent file', async () => {
    mockFs.access.mockRejectedValue(new Error('File not found'));

    await expect(validateInput('nonexistent.md', {})).rejects.toThrow(
      'Cannot read markdown file: nonexistent.md'
    );
  });

  it('should throw error for non-markdown file', async () => {
    mockFs.access.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ isFile: () => true } as any);

    await expect(validateInput('test.txt', {})).rejects.toThrow(
      'Input file must be a markdown file (.md or .markdown)'
    );
  });

  it('should throw error for directory instead of file', async () => {
    mockFs.access.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ isFile: () => false } as any);

    await expect(validateInput('test.md', {})).rejects.toThrow(
      'test.md is not a file'
    );
  });

  it('should throw error for invalid format', async () => {
    mockFs.access.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ isFile: () => true } as any);

    await expect(validateInput('test.md', { format: 'gif' })).rejects.toThrow(
      'Format must be either "png" or "jpeg"'
    );
  });

  it('should throw error for invalid JPEG quality', async () => {
    mockFs.access.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ isFile: () => true } as any);

    await expect(validateInput('test.md', { 
      format: 'jpeg', 
      quality: '150' 
    })).rejects.toThrow(
      'JPEG quality must be between 1 and 100'
    );
  });

  it('should throw error for invalid scale', async () => {
    mockFs.access.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ isFile: () => true } as any);

    await expect(validateInput('test.md', { scale: '10' })).rejects.toThrow(
      'Scale must be between 1 and 5'
    );
  });

  it('should accept .markdown extension', async () => {
    mockFs.access.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ isFile: () => true } as any);

    const result = await validateInput('test.markdown', {
      output: './images',
      format: 'png',
      quality: '85',
      scale: '2'
    });

    expect(result.format).toBe('png');
    expect(result.verbose).toBe(false);
  });
});