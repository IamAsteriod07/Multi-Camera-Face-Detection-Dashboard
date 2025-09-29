import { useState } from "react";
import { AlertTriangle, Camera, Clock, User, Filter, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Alert {
  id: string;
  cameraId: string;
  cameraName: string;
  timestamp: Date;
  detectionCount: number;
  confidence: number;
  imageUrl?: string;
}

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

interface AlertsPanelProps {
  alerts: Alert[];
  cameras: Camera[];
}

export const AlertsPanel = ({ alerts, cameras }: AlertsPanelProps) => {
  const [filterCamera, setFilterCamera] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "confidence">("newest");

  const filteredAlerts = alerts
    .filter(alert => filterCamera === "all" || alert.cameraId === filterCamera)
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return a.timestamp.getTime() - b.timestamp.getTime();
        case "confidence":
          return b.confidence - a.confidence;
        case "newest":
        default:
          return b.timestamp.getTime() - a.timestamp.getTime();
      }
    });

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "bg-success text-success-foreground";
    if (confidence >= 0.8) return "bg-warning text-warning-foreground";
    return "bg-accent text-accent-foreground";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return "High";
    if (confidence >= 0.8) return "Medium";
    return "Low";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Detection Alerts</h2>
          <p className="text-sm text-muted-foreground">
            Real-time face detection notifications from active cameras
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterCamera} onValueChange={setFilterCamera}>
              <SelectTrigger className="w-40 bg-card border-border text-foreground">
                <SelectValue placeholder="Filter by camera" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all" className="text-foreground">All Cameras</SelectItem>
                {cameras.map((camera) => (
                  <SelectItem key={camera.id} value={camera.id} className="text-foreground">
                    {camera.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Select value={sortBy} onValueChange={(value: "newest" | "oldest" | "confidence") => setSortBy(value)}>
            <SelectTrigger className="w-32 bg-card border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="newest" className="text-foreground">Newest</SelectItem>
              <SelectItem value="oldest" className="text-foreground">Oldest</SelectItem>
              <SelectItem value="confidence" className="text-foreground">Confidence</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Alerts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/95 backdrop-blur border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/95 backdrop-blur border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(alerts.map(alert => alert.cameraId)).size}
                </p>
                <p className="text-sm text-muted-foreground">Active Cameras</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/95 backdrop-blur border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {alerts.filter(alert => {
                    const diff = new Date().getTime() - alert.timestamp.getTime();
                    return diff < 3600000; // Last hour
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">Last Hour</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card className="bg-card/95 backdrop-blur border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Recent Detections</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {filteredAlerts.length} alerts {filterCamera !== "all" && `from ${cameras.find(c => c.id === filterCamera)?.name}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No alerts found</p>
              <p className="text-sm">Face detections will appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-accent" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-foreground">{alert.cameraName}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {alert.detectionCount} {alert.detectionCount === 1 ? 'face' : 'faces'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(alert.timestamp)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Camera className="w-3 h-3" />
                          <span>{cameras.find(c => c.id === alert.cameraId)?.location || 'Unknown Location'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={getConfidenceColor(alert.confidence)}>
                      {getConfidenceLabel(alert.confidence)} ({Math.round(alert.confidence * 100)}%)
                    </Badge>
                    
                    <Button size="sm" variant="outline" className="border-border text-foreground hover:bg-muted">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};