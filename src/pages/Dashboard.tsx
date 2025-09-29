import { useState, useEffect } from "react";
import { CameraGrid } from "@/components/dashboard/CameraGrid";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CameraManagement } from "@/components/dashboard/CameraManagement";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { FaceRecognitionDashboard } from "@/components/face-recognition/FaceRecognitionDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface Alert {
  id: string;
  cameraId: string;
  cameraName: string;
  timestamp: Date;
  detectionCount: number;
  confidence: number;
  imageUrl?: string;
}

const Dashboard = () => {
  const [cameras, setCameras] = useState<Camera[]>([
    {
      id: "cam-001",
      name: "Main Entrance",
      rtspUrl: "rtsp://192.168.1.100:554/stream1",
      location: "Building A - Front Door",
      isActive: true,
      isRecording: true,
      fps: 30,
      lastDetection: new Date(Date.now() - 300000),
    },
    {
      id: "cam-002", 
      name: "Parking Lot",
      rtspUrl: "rtsp://192.168.1.101:554/stream1",
      location: "Building A - Parking",
      isActive: true,
      isRecording: false,
      fps: 25,
      lastDetection: new Date(Date.now() - 120000),
    },
    {
      id: "cam-003",
      name: "Reception Area",
      rtspUrl: "rtsp://192.168.1.102:554/stream1", 
      location: "Building A - Lobby",
      isActive: false,
      isRecording: false,
      fps: 0,
    },
    {
      id: "cam-004",
      name: "Loading Dock",
      rtspUrl: "rtsp://192.168.1.103:554/stream1",
      location: "Building B - Rear",
      isActive: true,
      isRecording: true,
      fps: 30,
      lastDetection: new Date(Date.now() - 60000),
    },
  ]);

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: "alert-001",
      cameraId: "cam-001",
      cameraName: "Main Entrance",
      timestamp: new Date(Date.now() - 180000),
      detectionCount: 2,
      confidence: 0.94,
    },
    {
      id: "alert-002", 
      cameraId: "cam-004",
      cameraName: "Loading Dock",
      timestamp: new Date(Date.now() - 60000),
      detectionCount: 1,
      confidence: 0.87,
    },
  ]);

  const [isConnected, setIsConnected] = useState(false);

  // Simulate WebSocket connection
  useEffect(() => {
    const timer = setTimeout(() => setIsConnected(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Simulate receiving real-time alerts
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      const activeCameras = cameras.filter(cam => cam.isActive);
      if (activeCameras.length === 0) return;

      const randomCamera = activeCameras[Math.floor(Math.random() * activeCameras.length)];
      const newAlert: Alert = {
        id: `alert-${Date.now()}`,
        cameraId: randomCamera.id,
        cameraName: randomCamera.name,
        timestamp: new Date(),
        detectionCount: Math.floor(Math.random() * 3) + 1,
        confidence: 0.8 + Math.random() * 0.2,
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
      
      // Update camera last detection
      setCameras(prev => prev.map(cam => 
        cam.id === randomCamera.id 
          ? { ...cam, lastDetection: new Date() }
          : cam
      ));
    }, 8000 + Math.random() * 15000);

    return () => clearInterval(interval);
  }, [isConnected, cameras]);

  const handleCameraToggle = (cameraId: string) => {
    setCameras(prev => prev.map(cam => 
      cam.id === cameraId 
        ? { ...cam, isActive: !cam.isActive, fps: !cam.isActive ? 30 : 0 }
        : cam
    ));
  };

  const handleAddCamera = (cameraData: Omit<Camera, 'id' | 'isActive' | 'isRecording' | 'fps'>) => {
    const newCamera: Camera = {
      ...cameraData,
      id: `cam-${Date.now()}`,
      isActive: false,
      isRecording: false,
      fps: 0,
    };
    setCameras(prev => [...prev, newCamera]);
  };

  const handleUpdateCamera = (cameraId: string, updates: Partial<Camera>) => {
    setCameras(prev => prev.map(cam => 
      cam.id === cameraId ? { ...cam, ...updates } : cam
    ));
  };

  const handleDeleteCamera = (cameraId: string) => {
    setCameras(prev => prev.filter(cam => cam.id !== cameraId));
    setAlerts(prev => prev.filter(alert => alert.cameraId !== cameraId));
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        totalCameras={cameras.length}
        activeCameras={cameras.filter(cam => cam.isActive).length}
        totalAlerts={alerts.length}
        isConnected={isConnected}
      />
      
      <div className="container mx-auto p-6 space-y-6">
        <Tabs defaultValue="cameras" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card border-border">
            <TabsTrigger value="cameras" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Camera Feed
            </TabsTrigger>
            <TabsTrigger value="management" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Management
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Alerts
            </TabsTrigger>
            <TabsTrigger value="face-recognition" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Face Recognition
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cameras" className="space-y-6">
            <CameraGrid 
              cameras={cameras}
              onToggleCamera={handleCameraToggle}
            />
          </TabsContent>
          
          <TabsContent value="management" className="space-y-6">
            <CameraManagement
              cameras={cameras}
              onAddCamera={handleAddCamera}
              onUpdateCamera={handleUpdateCamera}
              onDeleteCamera={handleDeleteCamera}
            />
          </TabsContent>
          
          <TabsContent value="alerts" className="space-y-6">
            <AlertsPanel alerts={alerts} cameras={cameras} />
          </TabsContent>
          
          <TabsContent value="face-recognition" className="space-y-6">
            <FaceRecognitionDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;