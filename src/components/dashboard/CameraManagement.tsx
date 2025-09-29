import { useState } from "react";
import { Plus, Edit, Trash2, Settings, MapPin, Link, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

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

interface CameraManagementProps {
  cameras: Camera[];
  onAddCamera: (camera: Omit<Camera, 'id' | 'isActive' | 'isRecording' | 'fps'>) => void;
  onUpdateCamera: (cameraId: string, updates: Partial<Camera>) => void;
  onDeleteCamera: (cameraId: string) => void;
}

export const CameraManagement = ({ 
  cameras, 
  onAddCamera, 
  onUpdateCamera, 
  onDeleteCamera 
}: CameraManagementProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    rtspUrl: "",
    location: ""
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({ name: "", rtspUrl: "", location: "" });
    setEditingCamera(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.rtspUrl || !formData.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    onAddCamera(formData);
    resetForm();
    setIsAddDialogOpen(false);
    
    toast({
      title: "Camera Added",
      description: `${formData.name} has been added successfully`,
    });
  };

  const handleEdit = (camera: Camera) => {
    setEditingCamera(camera);
    setFormData({
      name: camera.name,
      rtspUrl: camera.rtspUrl,
      location: camera.location
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCamera) return;

    onUpdateCamera(editingCamera.id, formData);
    resetForm();
    
    toast({
      title: "Camera Updated", 
      description: `${formData.name} has been updated successfully`,
    });
  };

  const handleDelete = (camera: Camera) => {
    onDeleteCamera(camera.id);
    toast({
      title: "Camera Deleted",
      description: `${camera.name} has been removed`,
      variant: "destructive",
    });
  };

  const formatLastDetection = (date?: Date) => {
    if (!date) return "No detections";
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Camera Management</h2>
          <p className="text-sm text-muted-foreground">Manage your camera endpoints and configurations</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Camera
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Camera</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Configure a new camera endpoint for monitoring
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Camera Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Main Entrance"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-input border-border text-foreground"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rtspUrl" className="text-foreground">RTSP URL</Label>
                <Input
                  id="rtspUrl"
                  placeholder="rtsp://192.168.1.100:554/stream1"
                  value={formData.rtspUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, rtspUrl: e.target.value }))}
                  className="bg-input border-border text-foreground"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location" className="text-foreground">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. Building A - Front Door"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="bg-input border-border text-foreground"
                  required
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                  Add Camera
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Camera List */}
      <Card className="bg-card/95 backdrop-blur border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Registered Cameras</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {cameras.length} cameras configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-foreground">Name</TableHead>
                  <TableHead className="text-foreground">Location</TableHead>
                  <TableHead className="text-foreground">RTSP URL</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground">Last Detection</TableHead>
                  <TableHead className="text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cameras.map((camera) => (
                  <TableRow key={camera.id} className="border-border">
                    <TableCell className="font-medium text-foreground">
                      {camera.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{camera.location}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      <div className="flex items-center space-x-1">
                        <Link className="w-3 h-3" />
                        <span>{camera.rtspUrl}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={camera.isActive ? "default" : "secondary"}
                          className={camera.isActive 
                            ? 'bg-success text-success-foreground' 
                            : 'bg-secondary text-secondary-foreground'
                          }
                        >
                          <Wifi className="w-3 h-3 mr-1" />
                          {camera.isActive ? 'Online' : 'Offline'}
                        </Badge>
                        {camera.isRecording && (
                          <Badge className="bg-destructive text-destructive-foreground">
                            Recording
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatLastDetection(camera.lastDetection)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(camera)}
                          className="border-border text-foreground hover:bg-muted"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(camera)}
                          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingCamera} onOpenChange={() => resetForm()}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Camera</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update camera configuration
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-foreground">Camera Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-input border-border text-foreground"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-rtspUrl" className="text-foreground">RTSP URL</Label>
              <Input
                id="edit-rtspUrl"
                value={formData.rtspUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, rtspUrl: e.target.value }))}
                className="bg-input border-border text-foreground"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-location" className="text-foreground">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="bg-input border-border text-foreground"
                required
              />
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={resetForm}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                Update Camera
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};