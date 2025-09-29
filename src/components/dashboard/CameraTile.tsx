import { useState } from "react";
import { Play, Pause, Video, VideoOff, MapPin, Clock, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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

interface CameraTileProps {
  camera: Camera;
  onToggle: () => void;
}

export const CameraTile = ({ camera, onToggle }: CameraTileProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatLastDetection = (date?: Date) => {
    if (!date) return "No detections";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <Card 
      className={`
        bg-card/95 backdrop-blur border-border transition-all duration-300 overflow-hidden
        ${camera.isActive ? 'shadow-[var(--shadow-card)] hover:shadow-lg' : 'opacity-75'}
        ${camera.lastDetection && camera.isActive ? 'ring-1 ring-accent/30' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0">
        {/* Video Feed Area */}
        <div className="relative aspect-video bg-muted/30 overflow-hidden">
          {camera.isActive ? (
            <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted/80 flex items-center justify-center relative">
              {/* Simulated Video Feed */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 animate-pulse" />
              <div className="text-muted-foreground text-sm">
                Live Feed: {camera.name}
              </div>
              
              {/* Recording Indicator */}
              {camera.isRecording && (
                <div className="absolute top-3 right-3 flex items-center space-x-1 bg-destructive/90 text-destructive-foreground px-2 py-1 rounded-full text-xs">
                  <div className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
                  <span>REC</span>
                </div>
              )}
              
              {/* Detection Overlay */}
              {camera.lastDetection && (
                <div className="absolute top-3 left-3 bg-accent/90 text-accent-foreground px-2 py-1 rounded text-xs font-medium animate-alert-pulse">
                  Face Detected
                </div>
              )}
              
              {/* FPS Counter */}
              <div className="absolute bottom-3 left-3 bg-background/80 text-foreground px-2 py-1 rounded text-xs font-mono">
                {camera.fps} FPS
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-muted/20 flex items-center justify-center">
              <VideoOff className="w-12 h-12 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Hover Controls */}
          {isHovered && (
            <div className="absolute inset-0 bg-background/20 flex items-center justify-center backdrop-blur-sm">
              <Button
                onClick={onToggle}
                size="lg"
                variant="secondary"
                className={`
                  ${camera.isActive ? 'bg-destructive hover:bg-destructive/90' : 'bg-success hover:bg-success/90'}
                  text-white border-0
                `}
              >
                {camera.isActive ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Stream
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Stream
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        
        {/* Camera Info */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <h3 className="font-semibold text-foreground text-sm truncate">
                {camera.name}
              </h3>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{camera.location}</span>
              </div>
            </div>
            
            <Badge 
              variant={camera.isActive ? "default" : "secondary"}
              className={`
                ${camera.isActive 
                  ? 'bg-success text-success-foreground' 
                  : 'bg-secondary text-secondary-foreground'
                }
              `}
            >
              {camera.isActive ? 'Online' : 'Offline'}
            </Badge>
          </div>
          
          {/* Stats Row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatLastDetection(camera.lastDetection)}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {camera.isRecording && (
                <div className="flex items-center space-x-1 text-destructive">
                  <Video className="w-3 h-3" />
                  <span>Recording</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <Gauge className="w-3 h-3" />
                <span>{camera.fps} FPS</span>
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          <Button
            onClick={onToggle}
            size="sm"
            variant={camera.isActive ? "destructive" : "default"}
            className="w-full"
          >
            {camera.isActive ? 'Stop Stream' : 'Start Stream'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};