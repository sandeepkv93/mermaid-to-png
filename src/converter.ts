import fs from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import { renderMermaidToPng } from './mermaid-renderer';
import { ConversionOptions, ConversionResult } from './types';
import { fixMermaidSyntax, validateMermaidSyntax } from './utils/mermaid-fixer';

export async function convertMarkdownFile(
  markdownFile: string,
  options: ConversionOptions
): Promise<ConversionResult> {
  let content = await fs.readFile(markdownFile, 'utf-8');
  let mermaidBlocks = extractMermaidBlocks(content);
  
  if (mermaidBlocks.length === 0) {
    throw new Error('No Mermaid diagrams found in the markdown file');
  }

  // Validate and optionally fix Mermaid syntax
  let totalChanges = 0;
  for (let i = 0; i < mermaidBlocks.length; i++) {
    const block = mermaidBlocks[i];
    
    // Validate syntax
    const issues = validateMermaidSyntax(block.content);
    if (issues.length > 0 && options.verbose) {
      console.log(`⚠️  Diagram ${i + 1} validation issues:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    }

    // Auto-fix if enabled
    if (options.autoFix && issues.length > 0) {
      const fixResult = fixMermaidSyntax(block.content);
      if (fixResult.changes.length > 0) {
        console.log(`🔧 Auto-fixed diagram ${i + 1}:`);
        fixResult.changes.forEach(change => console.log(`   - ${change}`));
        
        // Update the content with the fixed version
        content = content.substring(0, block.startIndex) +
                 `\`\`\`mermaid\n${fixResult.fixed}\`\`\`` +
                 content.substring(block.endIndex);
        
        // Re-extract blocks after fixing
        mermaidBlocks = extractMermaidBlocks(content);
        totalChanges += fixResult.changes.length;
      }
    }
  }

  // If validate-only mode, just report and exit
  if (options.validateOnly) {
    const totalIssues = mermaidBlocks.reduce((sum, block) => 
      sum + validateMermaidSyntax(block.content).length, 0);
    
    if (totalIssues === 0) {
      console.log(`✅ All ${mermaidBlocks.length} Mermaid diagrams have valid syntax.`);
    } else {
      console.log(`⚠️  Found syntax issues in ${mermaidBlocks.length} diagrams.`);
      if (!options.autoFix) {
        console.log(`💡 Use --auto-fix to attempt automatic fixes.`);
      }
    }

    return {
      outputFile: markdownFile,
      imageDirectory: options.output,
      convertedCount: 0
    };
  }

  // Write back the fixed content if changes were made
  if (totalChanges > 0) {
    await fs.writeFile(markdownFile, content, 'utf-8');
    console.log(`📝 Applied ${totalChanges} fixes to ${markdownFile}`);
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