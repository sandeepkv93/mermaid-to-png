#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { convertMarkdownFile } from './converter';
import { validateInput } from './utils/validator';
import { closeBrowser } from './mermaid-renderer';

const program = new Command();

program
  .name('mermaid-to-png')
  .description('Convert Mermaid diagrams in markdown files to PNG images')
  .version('1.0.0')
  .argument('<markdown-file>', 'Path to the markdown file containing Mermaid diagrams')
  .option('-o, --output <path>', 'Directory to save the generated images', './images')
  .option('-f, --format <format>', 'Image format (png or jpeg)', 'png')
  .option('-q, --quality <number>', 'JPEG quality (1-100, only for jpeg format)', '85')
  .option('-s, --scale <number>', 'Device scale factor for higher resolution', '2')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('--validate-only', 'Only validate Mermaid syntax without converting', false)
  .option('--auto-fix', 'Attempt to automatically fix common Mermaid syntax issues', false)
  .action(async (markdownFile: string, options) => {
    try {
      if (options.validateOnly) {
        console.log(chalk.blue('🔍 Validating Mermaid syntax...'));
      } else {
        console.log(chalk.blue('🚀 Starting Mermaid to PNG conversion...'));
      }
      
      const validatedOptions = await validateInput(markdownFile, options);
      
      const result = await convertMarkdownFile(markdownFile, validatedOptions);
      
      if (options.validateOnly) {
        // Validation results already printed in converter
        return;
      }
      
      console.log(chalk.green(`✅ Successfully converted ${result.convertedCount} Mermaid diagram(s)`));
      console.log(chalk.green(`📄 Output file: ${result.outputFile}`));
      console.log(chalk.green(`🖼️  Images saved to: ${result.imageDirectory}`));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    } finally {
      await closeBrowser();
    }
  });

program.parse();

process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});