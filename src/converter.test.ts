import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import fs from 'fs/promises';
import { convertMarkdownFile } from './converter';
import * as mermaidRenderer from './mermaid-renderer';

jest.mock('fs/promises');
jest.mock('./mermaid-renderer');

describe('convertMarkdownFile', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockRenderer = mermaidRenderer as jest.Mocked<typeof mermaidRenderer>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should convert markdown with single mermaid diagram', async () => {
    const markdownContent = `# Test Document

Here is a flowchart:

\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`

Some more text.`;

    const expectedOutput = `# Test Document

Here is a flowchart:

![Mermaid Diagram 1](images/test-diagram-1.png)

Some more text.`;

    mockFs.readFile.mockResolvedValue(markdownContent);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockRenderer.renderMermaidToPng.mockResolvedValue(undefined);

    const result = await convertMarkdownFile('test.md', {
      output: './images',
      format: 'png',
      quality: 85,
      scale: 2
    });

    expect(result.convertedCount).toBe(1);
    expect(result.outputFile).toBe('test-converted.md');
    expect(result.imageDirectory).toBe('./images');
    
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      'test-converted.md',
      expectedOutput,
      'utf-8'
    );
  });

  it('should convert markdown with multiple mermaid diagrams', async () => {
    const markdownContent = `# Test Document

\`\`\`mermaid
graph TD
    A[Start] --> B[End]
\`\`\`

\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hello
\`\`\``;

    mockFs.readFile.mockResolvedValue(markdownContent);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockRenderer.renderMermaidToPng.mockResolvedValue(undefined);

    const result = await convertMarkdownFile('test.md', {
      output: './images',
      format: 'png',
      quality: 85,
      scale: 2
    });

    expect(result.convertedCount).toBe(2);
    expect(mockRenderer.renderMermaidToPng).toHaveBeenCalledTimes(2);
  });

  it('should throw error when no mermaid diagrams found', async () => {
    const markdownContent = `# Test Document

No diagrams here.`;

    mockFs.readFile.mockResolvedValue(markdownContent);

    await expect(convertMarkdownFile('test.md', {
      output: './images',
      format: 'png',
      quality: 85,
      scale: 2
    })).rejects.toThrow('No Mermaid diagrams found in the markdown file');
  });

  it('should handle JPEG format with quality', async () => {
    const markdownContent = `\`\`\`mermaid
graph TD
    A[Start] --> B[End]
\`\`\``;

    mockFs.readFile.mockResolvedValue(markdownContent);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockRenderer.renderMermaidToPng.mockResolvedValue(undefined);

    await convertMarkdownFile('test.md', {
      output: './images',
      format: 'jpeg',
      quality: 90,
      scale: 2
    });

    expect(mockRenderer.renderMermaidToPng).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('.jpeg'),
      expect.objectContaining({
        format: 'jpeg',
        quality: 90
      })
    );
  });

  it('should preserve non-mermaid code blocks', async () => {
    const markdownContent = `# Test

\`\`\`javascript
console.log('hello');
\`\`\`

\`\`\`mermaid
graph TD
    A[Start] --> B[End]
\`\`\``;

    mockFs.readFile.mockResolvedValue(markdownContent);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockRenderer.renderMermaidToPng.mockResolvedValue(undefined);

    await convertMarkdownFile('test.md', {
      output: './images',
      format: 'png',
      quality: 85,
      scale: 2
    });

    const writtenContent = mockFs.writeFile.mock.calls[0][1] as string;
    expect(writtenContent).toContain('```javascript');
    expect(writtenContent).toContain("console.log('hello');");
  });
});