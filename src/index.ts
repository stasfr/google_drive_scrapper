import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { links } from './db';

import { ParserService } from './service';

class App {
  private parserService: ParserService;

  constructor() {
    this.parserService = new ParserService();
  }

  private createOutputDir() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const dirPath = path.join(__dirname, '..', 'output');

    if (fs.existsSync(dirPath)) return;

    fs.mkdirSync(dirPath, { recursive: true });
  }

  private async saveFile(data: { file: File; fileID: string }) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const dirPath = path.join(__dirname, '..', 'output');

    const buffer = await data.file.arrayBuffer();

    fs.writeFileSync(
      path.join(dirPath, `${data.fileID}.pdf`),
      Buffer.from(buffer)
    );
  }

  public async start() {
    try {
      this.createOutputDir();

      for (const link of links) {
        const result = await this.parserService.parse(link);
        if (result.ok) {
          await this.saveFile(result);
        } else {
          console.log(result.error);
        }

        console.log('===============================');
      }
    } catch (error: unknown) {
      console.log(error);
    }
  }
}

const app = new App();
app.start();
