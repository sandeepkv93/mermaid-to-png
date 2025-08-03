import puppeteer, { Browser } from 'puppeteer';
import { ConversionOptions } from './types';

let browser: Browser | null = null;

export async function renderMermaidToPng(
  mermaidCode: string,
  outputPath: string,
  options: ConversionOptions
): Promise<void> {
  if (options.verbose) {
    console.log(`[Renderer] Processing diagram of length: ${mermaidCode.length} characters`);
    console.log(`[Renderer] First 100 chars: ${mermaidCode.substring(0, 100)}...`);
  }
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  const page = await browser.newPage();
  
  try {
    // Set longer timeout for the page
    page.setDefaultTimeout(60000);
    
    // Enable console logging for debugging
    if (options.verbose) {
      page.on('console', msg => {
        console.log(`[Browser ${msg.type()}]:`, msg.text());
      });
      page.on('pageerror', error => {
        console.error('[Page Error]:', error.message);
      });
    }
    
    await page.setViewport({
      width: 2400,
      height: 1600,
      deviceScaleFactor: options.scale
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
          <script>
            window.renderComplete = false;
            window.renderError = null;
            
            mermaid.initialize({ 
              startOnLoad: false,
              theme: 'default',
              themeVariables: {
                primaryColor: '#fff',
                primaryTextColor: '#000',
                primaryBorderColor: '#000',
                lineColor: '#000',
                secondaryColor: '#f5f5f5',
                tertiaryColor: '#f0f0f0'
              },
              securityLevel: 'loose'
            });
            
            window.addEventListener('load', async () => {
              try {
                await mermaid.run();
                window.renderComplete = true;
              } catch (error) {
                window.renderError = error.message || 'Unknown error';
                console.error('Mermaid render error:', error);
              }
            });
          </script>
          <style>
            body { 
              margin: 0; 
              padding: 20px;
              background: white;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            #diagram {
              background: white;
              max-width: 2000px;
              max-height: 2000px;
            }
          </style>
        </head>
        <body>
          <div id="diagram" class="mermaid">
            ${mermaidCode}
          </div>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Wait for render to complete or error
    await page.waitForFunction(
      'window.renderComplete || window.renderError',
      { timeout: 45000 }
    );
    
    // Check for render errors
    const renderError = await page.evaluate('window.renderError');
    if (renderError) {
      throw new Error(`Mermaid render failed: ${renderError}`);
    }
    
    // Additional wait to ensure rendering is complete
    await page.waitForSelector('.mermaid[data-processed="true"]', { timeout: 15000 });

    const element = await page.$('#diagram');
    if (!element) {
      throw new Error('Failed to find diagram element');
    }

    const boundingBox = await element.boundingBox();
    if (!boundingBox) {
      throw new Error('Failed to get diagram dimensions');
    }

    const screenshotOptions: any = {
      path: outputPath,
      clip: {
        x: boundingBox.x - 10,
        y: boundingBox.y - 10,
        width: boundingBox.width + 20,
        height: boundingBox.height + 20
      }
    };

    if (options.format === 'jpeg') {
      screenshotOptions.type = 'jpeg';
      screenshotOptions.quality = options.quality;
    } else {
      screenshotOptions.type = 'png';
    }

    await page.screenshot(screenshotOptions);
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}