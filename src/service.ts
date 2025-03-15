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

export class ParserService {
  private async downloadFile(url: string): Promise<File | string> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        return `HTTP error! status: ${response.status}`;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || contentType.includes('text/html')) {
        return `Unexpected content type: ${contentType}`;
      }

      const buffer = await response.arrayBuffer();

      return new File([buffer], 'file', {
        type: response.headers.get('content-type') || 'application/pdf',
      });
    } catch (error: unknown) {
      return String(error);
    }
  }

  private extractFileId(url: string) {
    const regex = /\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  private getDownloadLink(link: string, fileID: string): string | null {
    if (link.includes('drive.google.com')) {
      return `https://drive.usercontent.google.com/u/0/uc?id=${fileID}&export=download`;
    }

    if (link.includes('docs.google.com')) {
      return `https://docs.google.com/presentation/d/${fileID}/export/pdf`;
    }

    return null;
  }

  public async parse(link: string): Promise<ParsingResult> {
    try {
      const fileID = this.extractFileId(link);

      if (!fileID) {
        return {
          ok: false,
          error: 'Invalid link. Link does not contain file ID.',
        };
      }

      const url = this.getDownloadLink(link, fileID);

      if (!url) {
        return {
          ok: false,
          error:
            'Unrecognized link. Link does not contain drive.google.com or docs.google.com',
        };
      }

      const result = await this.downloadFile(url);

      if (typeof result === 'string') {
        throw new Error(result);
      }

      return {
        ok: true,
        fileID,
        file: result,
      };
    } catch (error: unknown) {
      return {
        ok: false,
        error: String(error),
      };
    }
  }
}
