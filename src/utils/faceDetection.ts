// Face detection utilities and WebRTC integration
export interface DetectedFace {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  knownPersonId?: string;
  knownPersonName?: string;
  ageEstimate?: number;
  genderEstimate?: 'male' | 'female';
  embedding?: number[];
}

export interface FaceDetectionResult {
  timestamp: Date;
  cameraId: string;
  faces: DetectedFace[];
  imageData?: string; // Base64 encoded screenshot
}

// Mock face detection for demo purposes
// In a real implementation, this would integrate with computer vision libraries
export class FaceDetectionService {
  private isRunning = false;
  private cameras: Map<string, MediaStream> = new Map();
  private detectionCallbacks: ((result: FaceDetectionResult) => void)[] = [];

  async startDetection(cameraId: string, stream: MediaStream): Promise<void> {
    this.cameras.set(cameraId, stream);
    this.isRunning = true;
    
    // Simulate face detection every 2-5 seconds
    this.simulateDetection(cameraId);
  }

  stopDetection(cameraId: string): void {
    this.cameras.delete(cameraId);
    if (this.cameras.size === 0) {
      this.isRunning = false;
    }
  }

  onDetection(callback: (result: FaceDetectionResult) => void): void {
    this.detectionCallbacks.push(callback);
  }

  private simulateDetection(cameraId: string): void {
    if (!this.isRunning || !this.cameras.has(cameraId)) return;

    // Randomly trigger detections (30% chance every check)
    if (Math.random() > 0.7) {
      const mockFaces: DetectedFace[] = [
        {
          id: `face_${Date.now()}`,
          x: Math.random() * 0.6 + 0.2, // 20-80% of frame width
          y: Math.random() * 0.6 + 0.2, // 20-80% of frame height
          width: 0.15 + Math.random() * 0.1, // 15-25% of frame width
          height: 0.2 + Math.random() * 0.1, // 20-30% of frame height
          confidence: 0.7 + Math.random() * 0.3, // 70-100% confidence
          ageEstimate: Math.floor(Math.random() * 60) + 18, // 18-78 years
          genderEstimate: Math.random() > 0.5 ? 'male' : 'female',
          knownPersonId: Math.random() > 0.7 ? `person_${Math.floor(Math.random() * 5)}` : undefined,
          knownPersonName: Math.random() > 0.7 ? ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Johnson'][Math.floor(Math.random() * 4)] : undefined,
        }
      ];

      const result: FaceDetectionResult = {
        timestamp: new Date(),
        cameraId,
        faces: mockFaces,
        imageData: this.generateMockScreenshot(),
      };

      this.detectionCallbacks.forEach(callback => callback(result));
    }

    // Schedule next detection check
    setTimeout(() => this.simulateDetection(cameraId), 2000 + Math.random() * 3000);
  }

  private generateMockScreenshot(): string {
    // Generate a simple base64 encoded placeholder image
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 640, 480);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 640, 480);
      
      // Add timestamp
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText(`Detection at ${new Date().toLocaleTimeString()}`, 20, 30);
      
      // Add mock face rectangle
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(200, 150, 100, 120);
      ctx.fillText('Face Detected', 205, 140);
    }
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  // Compare face embeddings for recognition
  compareFaces(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) return 0;
    
    // Simple cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  // Generate mock face embedding (in real implementation, this would come from a neural network)
  generateEmbedding(): number[] {
    return Array.from({ length: 128 }, () => Math.random() * 2 - 1);
  }
}

export const faceDetectionService = new FaceDetectionService();