import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { links } from './db.js';

async function downloadFile(url, fileID) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream', // Загружаем как поток данных
    });

    const contentType = response.headers['content-type'];

    if (contentType.includes('text/html')) {
      console.error(
        'Ошибка загрузки файла. Либо файла не существует, либо закрыт доступ на скачивание'
      );
      return;
    }

    const writer = fs.createWriteStream(`output/${fileID}.pdf`);
    response.data.pipe(writer);

    writer.on('finish', () => console.log('Файл загружен!'));
    writer.on('error', (err) => console.error('Ошибка:', err));
  } catch (error) {
    console.error('Ошибка загрузки файла:', error.message);
  }
}

function extractFileId(url) {
  const regex = /\/d\/([a-zA-Z0-9_-]+)\//;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function createOutputDir() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const dirPath = path.join(__dirname, 'output');

  if (fs.existsSync(dirPath)) return;

  fs.mkdirSync(dirPath, { recursive: true });
}

function main() {
  createOutputDir();

  links.forEach(async (link) => {
    const fileID = extractFileId(link);

    if (link.includes('drive.google.com')) {
      const url = `https://drive.usercontent.google.com/u/0/uc?id=${fileID}&export=download`;
      await downloadFile(url, fileID);
    }

    if (link.includes('docs.google.com')) {
      const url = `https://www.googleapis.com/drive/v3/files/${fileID}/export?mimeType=application/pdf`;
      await downloadFile(url, fileID);
    }
  });
}

main();
