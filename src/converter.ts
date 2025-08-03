import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import { renderMermaidToPng } from './mermaid-renderer';
import { ConversionOptions, ConversionResult } from './types';

export async function convertMarkdownFile(
  markdownFile: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  const content = await fs.readFile(markdownFile, 'utf-8');
  const mermaidBlocks = extractMermaidBlocks(content);
  
  if (mermaidBlocks.length === 0) {
    throw new Error('No Mermaid diagrams found in the markdown file');
  }

  await fs.mkdir(options.output, { recursive: true });

  const convertedContent = await replaceMermaidWithImages(
    content,
    mermaidBlocks,
    markdownFile,
    options
  );

  const outputFile = getOutputFilePath(markdownFile);
  await fs.writeFile(outputFile, convertedContent, 'utf-8');

  return {
    outputFile,
    imageDirectory: options.output,
    convertedCount: mermaidBlocks.length
  };
}

interface MermaidBlock {
  content: string;
  startIndex: number;
  endIndex: number;
  fullMatch: string;
}

function extractMermaidBlocks(content: string): MermaidBlock[] {
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
  const blocks: MermaidBlock[] = [];
  let match;

  while ((match = mermaidRegex.exec(content)) !== null) {
    blocks.push({
      content: match[1].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      fullMatch: match[0]
    });
  }

  return blocks;
}

async function replaceMermaidWithImages(
  content: string,
  blocks: MermaidBlock[],
  markdownFile: string,
  options: ConversionOptions
): Promise<string> {
  let modifiedContent = content;
  let offset = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const imageFileName = `${path.basename(markdownFile, path.extname(markdownFile))}-diagram-${i + 1}.${options.format}`;
    const imagePath = path.join(options.output, imageFileName);

    await renderMermaidToPng(block.content, imagePath, options);

    const relativePath = path.relative(path.dirname(markdownFile), imagePath);
    const imageMarkdown = `![Mermaid Diagram ${i + 1}](${relativePath})`;

    modifiedContent = 
      modifiedContent.substring(0, block.startIndex + offset) +
      imageMarkdown +
      modifiedContent.substring(block.endIndex + offset);

    offset += imageMarkdown.length - block.fullMatch.length;
  }

  return modifiedContent;
}

function getOutputFilePath(markdownFile: string): string {
  const dir = path.dirname(markdownFile);
  const basename = path.basename(markdownFile, path.extname(markdownFile));
  return path.join(dir, `${basename}-converted.md`);
}