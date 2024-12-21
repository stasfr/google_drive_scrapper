import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { links } from './db.js';

async function downloadFile(fileID) {
  const url = `https://drive.usercontent.google.com/u/0/uc?id=${fileID}&export=download`;
  console.log(url);
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream', // Загружаем как поток данных
    });

    const writer = fs.createWriteStream(`output/${fileID}.pdf`);
    response.data.pipe(writer);

    writer.on('finish', () => console.log('Файл загружен!'));
    writer.on('error', (err) => console.error('Ошибка:', err));
  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
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
    await downloadFile(fileID);
  });
}

main();
