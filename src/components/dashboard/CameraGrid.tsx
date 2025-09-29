import { CameraTile } from "./CameraTile";

interface Camera {
  id: string;
  name: string;
  rtspUrl: string; 
  location: string;
  isActive: boolean;
  isRecording: boolean;
  fps: number;
  lastDetection?: Date;
}

interface CameraGridProps {
  cameras: Camera[];
  onToggleCamera: (cameraId: string) => void;
}

export const CameraGrid = ({ cameras, onToggleCamera }: CameraGridProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Live Camera Feeds</h2>
        <p className="text-sm text-muted-foreground">
          {cameras.filter(cam => cam.isActive).length} of {cameras.length} cameras active
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {cameras.map((camera) => (
          <CameraTile
            key={camera.id}
            camera={camera}
            onToggle={() => onToggleCamera(camera.id)}
          />
        ))}
      </div>
    </div>
  );
};