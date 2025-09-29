import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { History, Camera, User, Clock, AlertCircle, Eye, Download } from 'lucide-react';
import { useFaceRecognition } from '@/hooks/useFaceRecognition';
import { formatDistance } from 'date-fns';

export const DetectionHistory = () => {
  const { recentDetections } = useFaceRecognition();
  const [filterCamera, setFilterCamera] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('timestamp');

  const filteredDetections = recentDetections
    .filter(detection => filterCamera === 'all' || detection.camera_id === filterCamera)
    .sort((a, b) => {
      if (sortBy === 'timestamp') {
        return new Date(b.event_timestamp).getTime() - new Date(a.event_timestamp).getTime();
      } else if (sortBy === 'confidence') {
        return b.confidence_score - a.confidence_score;
      }
      return 0;
    });

  const uniqueCameras = Array.from(new Set(recentDetections.map(d => d.camera_id)));

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-success text-success-foreground';
    if (confidence >= 0.6) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const getGenderIcon = (gender?: string) => {
    if (!gender) return null;
    return gender.toLowerCase() === 'male' ? '♂' : '♀';
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-foreground">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-accent" />
            Detection History ({filteredDetections.length})
          </div>
          <div className="flex gap-2">
            <Select value={filterCamera} onValueChange={setFilterCamera}>
              <SelectTrigger className="w-40 bg-input border-border">
                <SelectValue placeholder="Filter by camera" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Cameras</SelectItem>
                {uniqueCameras.map(cameraId => (
                  <SelectItem key={cameraId} value={cameraId}>
                    Camera {cameraId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 bg-input border-border">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="timestamp">Time</SelectItem>
                <SelectItem value="confidence">Confidence</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredDetections.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No detections found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Face detections will appear here once your cameras start monitoring
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDetections.map((detection) => (
              <Card key={detection.id} className="bg-secondary/20 border-border hover:bg-secondary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar/Detection Image */}
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={detection.screenshot_url} />
                        <AvatarFallback>
                          <User className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <Badge 
                        className={`absolute -top-1 -right-1 text-xs px-1 ${getConfidenceColor(detection.confidence_score)}`}
                      >
                        {Math.round(detection.confidence_score * 100)}%
                      </Badge>
                    </div>

                    {/* Detection Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">
                          {detection.detected_name || 'Unknown Person'}
                        </h4>
                        {detection.estimated_gender && (
                          <span className="text-sm text-muted-foreground">
                            {getGenderIcon(detection.estimated_gender)}
                          </span>
                        )}
                        {detection.estimated_age && (
                          <Badge variant="outline" className="text-xs">
                            Age ~{detection.estimated_age}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          {detection.camera_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistance(new Date(detection.event_timestamp), new Date(), { addSuffix: true })}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {detection.screenshot_url && (
                        <Button size="sm" variant="outline" className="border-border">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="border-border">
                        <Download className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>

                  {/* Bounding Box Info */}
                  {detection.bounding_box && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Detection area: {detection.bounding_box.width}×{detection.bounding_box.height} 
                        at ({detection.bounding_box.x}, {detection.bounding_box.y})
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};