import fs from 'fs/promises';
import path from 'path';
import { ConversionOptions } from '../types';

export async function validateInput(
  markdownFile: string,
  options: any
): Promise<ConversionOptions> {
  try {
    await fs.access(markdownFile, fs.constants.R_OK);
  } catch {
    throw new Error(`Cannot read markdown file: ${markdownFile}`);
  }

  const stats = await fs.stat(markdownFile);
  if (!stats.isFile()) {
    throw new Error(`${markdownFile} is not a file`);
  }

  if (!markdownFile.endsWith('.md') && !markdownFile.endsWith('.markdown')) {
    throw new Error('Input file must be a markdown file (.md or .markdown)');
  }

  const format = options.format?.toLowerCase();
  if (format && format !== 'png' && format !== 'jpeg') {
    throw new Error('Format must be either "png" or "jpeg"');
  }

  const quality = parseInt(options.quality);
  if (format === 'jpeg' && (isNaN(quality) || quality < 1 || quality > 100)) {
    throw new Error('JPEG quality must be between 1 and 100');
  }

  const scale = parseFloat(options.scale);
  if (isNaN(scale) || scale < 1 || scale > 5) {
    throw new Error('Scale must be between 1 and 5');
  }

  const outputPath = path.resolve(options.output);

  return {
    output: outputPath,
    format: format || 'png',
    quality: quality || 85,
    scale: scale || 2,
    verbose: options.verbose || false
  };
}