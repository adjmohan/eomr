// Client-side OMR processing utilities and helpers
export interface OMRMark {
  x: number;
  y: number;
  width: number;
  height: number;
  filled: boolean;
  confidence: number;
}

export interface OMRQuestion {
  id: string;
  text: string;
  type: 'rating' | 'multiple_choice' | 'yes_no';
  options: number;
  marks: OMRMark[];
}

export interface OMRTemplate {
  id: string;
  name: string;
  version: string;
  questions: OMRQuestion[];
  calibrationPoints: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  };
}

export class OMRProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  // Load image from file
  async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // Preprocess image for better OMR detection
  async preprocessImage(image: HTMLImageElement): Promise<ImageData> {
    this.canvas.width = image.width;
    this.canvas.height = image.height;
    this.ctx.drawImage(image, 0, 0);

    const imageData = this.ctx.getImageData(0, 0, image.width, image.height);
    
    // Convert to grayscale and enhance contrast
    this.convertToGrayscale(imageData);
    this.enhanceContrast(imageData);
    this.reduceNoise(imageData);

    return imageData;
  }

  // Convert image to grayscale
  private convertToGrayscale(imageData: ImageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      data[i] = gray;     // Red
      data[i + 1] = gray; // Green
      data[i + 2] = gray; // Blue
      // Alpha channel remains unchanged
    }
  }

  // Enhance contrast for better mark detection
  private enhanceContrast(imageData: ImageData, factor: number = 1.5) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128));
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128));
    }
  }

  // Simple noise reduction
  private reduceNoise(imageData: ImageData) {
    // Implement a simple median filter or gaussian blur
    // This is a simplified implementation
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Apply a simple 3x3 average filter
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        let r = 0, g = 0, b = 0;
        
        // Sample 3x3 neighborhood
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            r += data[nIdx];
            g += data[nIdx + 1];
            b += data[nIdx + 2];
          }
        }
        
        data[idx] = r / 9;
        data[idx + 1] = g / 9;
        data[idx + 2] = b / 9;
      }
    }
  }

  // Detect OMR marks in specific regions
  detectMarks(imageData: ImageData, template: OMRTemplate): OMRMark[] {
    const marks: OMRMark[] = [];
    
    template.questions.forEach(question => {
      question.marks.forEach(mark => {
        const fillPercentage = this.calculateFillPercentage(
          imageData,
          mark.x,
          mark.y,
          mark.width,
          mark.height
        );
        
        marks.push({
          ...mark,
          filled: fillPercentage > 0.3, // Threshold for considering a mark as filled
          confidence: Math.min(1, fillPercentage * 2) // Convert to confidence score
        });
      });
    });

    return marks;
  }

  // Calculate how much of a region is filled/marked
  private calculateFillPercentage(
    imageData: ImageData,
    x: number,
    y: number,
    width: number,
    height: number
  ): number {
    const data = imageData.data;
    const imgWidth = imageData.width;
    let totalPixels = 0;
    let darkPixels = 0;

    for (let py = y; py < y + height; py++) {
      for (let px = x; px < x + width; px++) {
        if (px >= 0 && px < imgWidth && py >= 0 && py < imageData.height) {
          const idx = (py * imgWidth + px) * 4;
          const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          
          totalPixels++;
          if (brightness < 128) { // Consider pixels darker than 128 as marks
            darkPixels++;
          }
        }
      }
    }

    return totalPixels > 0 ? darkPixels / totalPixels : 0;
  }

  // Get default OMR template for feedback forms
  static getDefaultTemplate(): OMRTemplate {
    return {
      id: 'feedback-v1',
      name: 'Standard Feedback Form',
      version: '1.0',
      calibrationPoints: {
        topLeft: { x: 50, y: 50 },
        topRight: { x: 550, y: 50 },
        bottomLeft: { x: 50, y: 750 },
        bottomRight: { x: 550, y: 750 }
      },
      questions: [
        {
          id: '1',
          text: 'Course Content Quality',
          type: 'rating',
          options: 5,
          marks: Array.from({ length: 5 }, (_, i) => ({
            x: 100 + i * 40,
            y: 150,
            width: 20,
            height: 20,
            filled: false,
            confidence: 0
          }))
        },
        {
          id: '2',
          text: 'Teaching Effectiveness',
          type: 'rating',
          options: 5,
          marks: Array.from({ length: 5 }, (_, i) => ({
            x: 100 + i * 40,
            y: 250,
            width: 20,
            height: 20,
            filled: false,
            confidence: 0
          }))
        },
        {
          id: '3',
          text: 'Learning Materials',
          type: 'rating',
          options: 5,
          marks: Array.from({ length: 5 }, (_, i) => ({
            x: 100 + i * 40,
            y: 350,
            width: 20,
            height: 20,
            filled: false,
            confidence: 0
          }))
        },
        {
          id: '4',
          text: 'Assessment Methods',
          type: 'rating',
          options: 5,
          marks: Array.from({ length: 5 }, (_, i) => ({
            x: 100 + i * 40,
            y: 450,
            width: 20,
            height: 20,
            filled: false,
            confidence: 0
          }))
        },
        {
          id: '5',
          text: 'Overall Satisfaction',
          type: 'rating',
          options: 5,
          marks: Array.from({ length: 5 }, (_, i) => ({
            x: 100 + i * 40,
            y: 550,
            width: 20,
            height: 20,
            filled: false,
            confidence: 0
          }))
        }
      ]
    };
  }

  // Validate file type and size
  static validateFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported. Please upload JPG, PNG, or PDF files.'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size too large. Please upload files smaller than 10MB.'
      };
    }

    return { valid: true };
  }

  // Clean up resources
  dispose() {
    if (this.canvas) {
      this.canvas.remove();
    }
  }
}

// Utility functions for OMR processing
export const OMRUtils = {
  // Generate unique batch code
  generateBatchCode(): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `OMR-${year}-${timestamp}`;
  },

  // Calculate overall score from responses
  calculateOverallScore(responses: any[]): number {
    if (!responses || responses.length === 0) return 0;
    
    const totalScore = responses.reduce((sum, response) => {
      return sum + (response.response || 0);
    }, 0);
    
    return Math.round((totalScore / responses.length) * 100) / 100;
  },

  // Get performance level based on score
  getPerformanceLevel(score: number): {
    level: string;
    color: string;
    description: string;
  } {
    if (score >= 4.5) {
      return {
        level: 'Excellent',
        color: 'text-success',
        description: 'Outstanding performance'
      };
    } else if (score >= 4.0) {
      return {
        level: 'Very Good',
        color: 'text-primary',
        description: 'Above average performance'
      };
    } else if (score >= 3.0) {
      return {
        level: 'Good',
        color: 'text-accent',
        description: 'Satisfactory performance'
      };
    } else if (score >= 2.0) {
      return {
        level: 'Average',
        color: 'text-warning',
        description: 'Meets minimum requirements'
      };
    } else {
      return {
        level: 'Needs Improvement',
        color: 'text-error',
        description: 'Below expectations'
      };
    }
  },

  // Format confidence as percentage
  formatConfidence(confidence: number): string {
    return `${Math.round(confidence * 100)}%`;
  },

  // Format processing time
  formatProcessingTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    }
  }
};
