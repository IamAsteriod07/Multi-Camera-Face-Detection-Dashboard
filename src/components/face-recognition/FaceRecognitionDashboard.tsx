import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaceRecognitionSettings } from './FaceRecognitionSettings';
import { KnownFacesManager } from './KnownFacesManager';
import { DetectionHistory } from './DetectionHistory';
import { Settings, Users, History } from 'lucide-react';

export const FaceRecognitionDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-2 h-8 bg-primary rounded-full" />
        <h2 className="text-2xl font-bold text-foreground">Face Recognition & Alerts</h2>
      </div>
      
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary/20">
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Detection History
          </TabsTrigger>
          <TabsTrigger value="faces" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Known Faces
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="history" className="mt-6">
          <DetectionHistory />
        </TabsContent>
        
        <TabsContent value="faces" className="mt-6">
          <KnownFacesManager />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <FaceRecognitionSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};