type SuccessParsing = {
  ok: true;
  fileID: string;
  file: File;
};

type ErrorParsing = {
  ok: false;
  error: string;
};

type ParsingResult = SuccessParsing | ErrorParsing;

// TODO: delete this
const test = true;

export class ParserService {
  private async downloadFile(url: string): Promise<File | string> {
    try {
      const response = await fetch(url);

      if (!response.ok || !response.body) {
        return `HTTP error! status: ${response.status}`;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || contentType.includes('text/html')) {
        return `Unexpected content type: ${contentType}`;
      }

      const reader = response.body.getReader();
      const result = await reader.read();
      const file = result.value;

      if (!file) {
        return 'File not found';
      }

      return new File([file], 'file');
    } catch (error: unknown) {
      return String(error);
    }
  }

  private extractFileId(url: string) {
    const regex = /\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  public async parse(link: string): Promise<ParsingResult> {
    try {
      const fileID = this.extractFileId(link);

      // TODO: delete this
      if (test) {
        return {
          ok: false,
          error: 'test mode',
        };
      }

      if (!fileID) {
        return {
          ok: false,
          error: 'Invalid link. Link does not contain file ID.',
        };
      }

      if (link.includes('drive.google.com')) {
        const url = `https://drive.usercontent.google.com/u/0/uc?id=${fileID}&export=download`;

        console.log('drive.google.com');
        console.log(url);

        const result = await this.downloadFile(url);
        console.log('result', result);
        if (typeof result === 'string') {
          throw new Error(result);
        }

        return {
          ok: true,
          fileID,
          file: result,
        };
      }

      // if (link.includes('docs.google.com')) {
      //   const url = `https://www.googleapis.com/drive/v3/files/${fileID}/export?mimeType=application/pdf`;
      //   console.log('docs.google.com', url);
      //   await this.downloadFile(url, fileID);
      // }

      return {
        ok: false,
        error: 'Unrecognized link. Link does not contain drive.google.com.',
      };
    } catch (error: unknown) {
      return {
        ok: false,
        error: String(error),
      };
    }
  }
}
