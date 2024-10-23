import * as pdfjs from 'pdfjs-dist';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface DocumentChunk {
  text: string;
  index: number;
  total: number;
}

interface ProcessingResult {
  success: boolean;
  message: string;
  chunks?: DocumentChunk[];
  error?: string;
}

export class DocumentProcessor {
  private static readonly CHUNK_SIZE = 1000;
  private static readonly MAX_TOKENS = 2048;
  private static processingQueue: DocumentChunk[] = [];
  private static isProcessing = false;

  private static async processPDF(file: File): Promise<ProcessingResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + ' ';
      }
      
      return {
        success: true,
        message: 'PDF processed successfully',
        chunks: await this.createChunks(fullText)
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process PDF',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static async processText(file: File): Promise<ProcessingResult> {
    try {
      const text = await file.text();
      return {
        success: true,
        message: 'Text file processed successfully',
        chunks: await this.createChunks(text)
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process text file',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static async createChunks(text: string): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;
    
    // Split text into sentences while preserving punctuation
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    for (const sentence of sentences) {
      const potentialChunk = currentChunk + sentence;
      
      if (this.countTokens(potentialChunk) > this.CHUNK_SIZE && currentChunk) {
        chunks.push({
          text: currentChunk.trim(),
          index: chunkIndex++,
          total: -1
        });
        currentChunk = sentence;
      } else {
        currentChunk = potentialChunk;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex++,
        total: -1
      });
    }
    
    // Update total count
    const total = chunks.length;
    chunks.forEach(chunk => chunk.total = total);
    
    return chunks;
  }

  public static async processDocument(file: File): Promise<ProcessingResult> {
    try {
      if (!file) {
        return {
          success: false,
          message: 'No file provided',
          error: 'File is required'
        };
      }

      let result: ProcessingResult;

      if (file.type === 'application/pdf') {
        result = await this.processPDF(file);
      } else if (file.type === 'text/plain') {
        result = await this.processText(file);
      } else {
        return {
          success: false,
          message: 'Unsupported file type',
          error: `File type ${file.type} is not supported. Please use PDF or TXT files.`
        };
      }

      if (result.success && result.chunks) {
        // Clear existing queue and add new chunks
        this.processingQueue = [...result.chunks];
        
        // Start processing if not already processing
        if (!this.isProcessing) {
          this.processQueue();
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process document',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private static async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) return;

    this.isProcessing = true;

    try {
      while (this.processingQueue.length > 0) {
        const chunk = this.processingQueue[0];
        await this.processChunk(chunk);
        this.processingQueue.shift();
        
        // Prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private static async processChunk(chunk: DocumentChunk): Promise<void> {
    try {
      // Process the chunk
      const tokens = this.tokenizeText(chunk.text);
      
      // Emit progress event
      const progress = ((chunk.index + 1) / chunk.total) * 100;
      const detail = {
        progress,
        currentChunk: chunk.index + 1,
        totalChunks: chunk.total,
        tokens: tokens.length
      };
      
      window.dispatchEvent(new CustomEvent('documentProcessingProgress', { detail }));
    } catch (error) {
      console.error('Chunk processing error:', error);
      // Continue with next chunk even if current fails
    }
  }

  public static tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private static countTokens(text: string): number {
    return this.tokenizeText(text).length;
  }

  public static getProcessingProgress(): number {
    if (this.processingQueue.length === 0) return 100;
    const firstChunk = this.processingQueue[0];
    return ((firstChunk.total - this.processingQueue.length) / firstChunk.total) * 100;
  }
}