import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { closeBrowser } from '../mermaid-renderer';

describe('Integration Tests', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const testOutputDir = path.join(__dirname, 'test-output');
  const sampleMdPath = path.join(fixturesDir, 'sample.md');
  const outputMdPath = path.join(fixturesDir, 'sample-converted.md');

  beforeAll(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  afterAll(async () => {
    await closeBrowser();
    if (fs.existsSync(outputMdPath)) {
      fs.unlinkSync(outputMdPath);
    }
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  it('should convert markdown file with default options', () => {
    const command = `node dist/cli.js "${sampleMdPath}" --output "${testOutputDir}"`;
    
    const output = execSync(command, { encoding: 'utf-8' });
    
    expect(output).toContain('Successfully converted 3 Mermaid diagram(s)');
    expect(fs.existsSync(outputMdPath)).toBe(true);
    expect(fs.existsSync(path.join(testOutputDir, 'sample-diagram-1.png'))).toBe(true);
    expect(fs.existsSync(path.join(testOutputDir, 'sample-diagram-2.png'))).toBe(true);
    expect(fs.existsSync(path.join(testOutputDir, 'sample-diagram-3.png'))).toBe(true);

    const convertedContent = fs.readFileSync(outputMdPath, 'utf-8');
    expect(convertedContent).toContain('![Mermaid Diagram 1]');
    expect(convertedContent).toContain('![Mermaid Diagram 2]');
    expect(convertedContent).toContain('![Mermaid Diagram 3]');
    expect(convertedContent).toContain('```javascript'); // Should preserve non-mermaid code blocks
  }, 30000);

  it('should convert to JPEG format when specified', () => {
    const jpegOutputDir = path.join(testOutputDir, 'jpeg');
    const command = `node dist/cli.js "${sampleMdPath}" --output "${jpegOutputDir}" --format jpeg --quality 90`;
    
    const output = execSync(command, { encoding: 'utf-8' });
    
    expect(output).toContain('Successfully converted 3 Mermaid diagram(s)');
    expect(fs.existsSync(path.join(jpegOutputDir, 'sample-diagram-1.jpeg'))).toBe(true);
    expect(fs.existsSync(path.join(jpegOutputDir, 'sample-diagram-2.jpeg'))).toBe(true);
    expect(fs.existsSync(path.join(jpegOutputDir, 'sample-diagram-3.jpeg'))).toBe(true);
  }, 30000);

  it('should handle invalid input file', () => {
    const command = `node dist/cli.js "nonexistent.md"`;
    
    expect(() => {
      execSync(command, { encoding: 'utf-8' });
    }).toThrow();
  });

  it('should handle markdown without mermaid diagrams', () => {
    const noMermaidPath = path.join(fixturesDir, 'no-mermaid.md');
    fs.writeFileSync(noMermaidPath, '# No Mermaid Here\n\nJust plain text.');
    
    const command = `node dist/cli.js "${noMermaidPath}"`;
    
    try {
      expect(() => {
        execSync(command, { encoding: 'utf-8' });
      }).toThrow();
    } finally {
      if (fs.existsSync(noMermaidPath)) {
        fs.unlinkSync(noMermaidPath);
      }
    }
  });

  it('should use custom scale factor', () => {
    const scaledOutputDir = path.join(testOutputDir, 'scaled');
    const command = `node dist/cli.js "${sampleMdPath}" --output "${scaledOutputDir}" --scale 3`;
    
    const output = execSync(command, { encoding: 'utf-8' });
    
    expect(output).toContain('Successfully converted 3 Mermaid diagram(s)');
    
    const image1Path = path.join(scaledOutputDir, 'sample-diagram-1.png');
    expect(fs.existsSync(image1Path)).toBe(true);
    
    const stats = fs.statSync(image1Path);
    expect(stats.size).toBeGreaterThan(0);
  }, 30000);
});