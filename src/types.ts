export interface ConversionOptions {
  output: string;
  format: 'png' | 'jpeg';
  quality: number;
  scale: number;
  verbose?: boolean;
  validateOnly?: boolean;
  autoFix?: boolean;
}

export interface ConversionResult {
  outputFile: string;
  imageDirectory: string;
  convertedCount: number;
}