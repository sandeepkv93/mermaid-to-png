import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import puppeteer from 'puppeteer';
import { renderMermaidToPng, closeBrowser } from './mermaid-renderer';

jest.mock('puppeteer');

describe('mermaid-renderer', () => {
  const mockPuppeteer = puppeteer as jest.Mocked<typeof puppeteer>;
  let mockBrowser: any;
  let mockPage: any;
  let mockElement: any;

  beforeEach(() => {
    mockElement = {
      boundingBox: jest.fn(() => Promise.resolve({
        x: 10,
        y: 10,
        width: 200,
        height: 100
      }))
    };

    mockPage = {
      setViewport: jest.fn(() => Promise.resolve()),
      setContent: jest.fn(() => Promise.resolve()),
      waitForSelector: jest.fn(() => Promise.resolve()),
      $: jest.fn(() => Promise.resolve(mockElement)),
      screenshot: jest.fn(() => Promise.resolve()),
      close: jest.fn(() => Promise.resolve())
    };

    mockBrowser = {
      newPage: jest.fn(() => Promise.resolve(mockPage)),
      close: jest.fn(() => Promise.resolve())
    };

    mockPuppeteer.launch.mockResolvedValue(mockBrowser as any);
  });

  afterEach(async () => {
    await closeBrowser();
    jest.clearAllMocks();
  });

  it('should render mermaid diagram to PNG', async () => {
    const mermaidCode = 'graph TD\n    A[Start] --> B[End]';
    const outputPath = '/tmp/test.png';

    await renderMermaidToPng(mermaidCode, outputPath, {
      output: '/tmp',
      format: 'png',
      quality: 85,
      scale: 2
    });

    expect(mockPuppeteer.launch).toHaveBeenCalledWith({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    expect(mockPage.setViewport).toHaveBeenCalledWith({
      width: 1200,
      height: 800,
      deviceScaleFactor: 2
    });

    expect(mockPage.setContent).toHaveBeenCalledWith(
      expect.stringContaining(mermaidCode)
    );

    expect(mockPage.screenshot).toHaveBeenCalledWith({
      path: outputPath,
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 220,
        height: 120
      }
    });
  });

  it('should render mermaid diagram to JPEG with quality', async () => {
    const mermaidCode = 'graph TD\n    A[Start] --> B[End]';
    const outputPath = '/tmp/test.jpeg';

    await renderMermaidToPng(mermaidCode, outputPath, {
      output: '/tmp',
      format: 'jpeg',
      quality: 90,
      scale: 1
    });

    expect(mockPage.screenshot).toHaveBeenCalledWith({
      path: outputPath,
      type: 'jpeg',
      quality: 90,
      clip: expect.any(Object)
    });
  });

  it('should reuse browser instance for multiple renders', async () => {
    await renderMermaidToPng('graph TD', '/tmp/test1.png', {
      output: '/tmp',
      format: 'png',
      quality: 85,
      scale: 2
    });

    await renderMermaidToPng('graph TD', '/tmp/test2.png', {
      output: '/tmp',
      format: 'png',
      quality: 85,
      scale: 2
    });

    expect(mockPuppeteer.launch).toHaveBeenCalledTimes(1);
    expect(mockBrowser.newPage).toHaveBeenCalledTimes(2);
  });

  it('should throw error when diagram element not found', async () => {
    mockPage.$ = jest.fn(() => Promise.resolve(null));

    await expect(renderMermaidToPng('graph TD', '/tmp/test.png', {
      output: '/tmp',
      format: 'png',
      quality: 85,
      scale: 2
    })).rejects.toThrow('Failed to find diagram element');
  });

  it('should throw error when bounding box not available', async () => {
    mockElement.boundingBox = jest.fn(() => Promise.resolve(null));

    await expect(renderMermaidToPng('graph TD', '/tmp/test.png', {
      output: '/tmp',
      format: 'png',
      quality: 85,
      scale: 2
    })).rejects.toThrow('Failed to get diagram dimensions');
  });

  it('should close browser when closeBrowser is called', async () => {
    await renderMermaidToPng('graph TD', '/tmp/test.png', {
      output: '/tmp',
      format: 'png',
      quality: 85,
      scale: 2
    });

    await closeBrowser();

    expect(mockBrowser.close).toHaveBeenCalled();
  });
});