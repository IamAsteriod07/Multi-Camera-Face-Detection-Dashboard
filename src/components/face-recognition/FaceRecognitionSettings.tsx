import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Settings, Brain, Bell, Camera, MessageCircle } from 'lucide-react';
import { useFaceRecognition, FaceRecognitionConfig } from '@/hooks/useFaceRecognition';

export const FaceRecognitionSettings = () => {
  const { config, saveConfig, isLoading } = useFaceRecognition();
  const [localConfig, setLocalConfig] = useState<FaceRecognitionConfig>(config);

  const handleSave = () => {
    saveConfig(localConfig);
  };

  const updateConfig = (key: keyof FaceRecognitionConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Settings className="w-5 h-5 text-primary" />
          Face Recognition Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Detection Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Detection Settings</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confidence-threshold" className="text-foreground">
              Confidence Threshold: {Math.round(localConfig.confidence_threshold * 100)}%
            </Label>
            <Slider
              id="confidence-threshold"
              min={0.1}
              max={1.0}
              step={0.1}
              value={[localConfig.confidence_threshold]}
              onValueChange={([value]) => updateConfig('confidence_threshold', value)}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Higher values reduce false positives but may miss valid detections
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="age-detection" className="text-foreground">Age Detection</Label>
            <Switch
              id="age-detection"
              checked={localConfig.age_detection_enabled}
              onCheckedChange={(checked) => updateConfig('age_detection_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="gender-detection" className="text-foreground">Gender Detection</Label>
            <Switch
              id="gender-detection"
              checked={localConfig.gender_detection_enabled}
              onCheckedChange={(checked) => updateConfig('gender_detection_enabled', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Alert Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-warning" />
            <h3 className="text-lg font-semibold text-foreground">Alert Settings</h3>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="visual-alerts" className="text-foreground">Visual Alerts</Label>
            <Switch
              id="visual-alerts"
              checked={localConfig.visual_alerts_enabled}
              onCheckedChange={(checked) => updateConfig('visual_alerts_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="audio-alerts" className="text-foreground">Audio Alerts</Label>
            <Switch
              id="audio-alerts"
              checked={localConfig.audio_alerts_enabled}
              onCheckedChange={(checked) => updateConfig('audio_alerts_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-evidence" className="text-foreground">Automatic Evidence Capture</Label>
            <Switch
              id="auto-evidence"
              checked={localConfig.auto_evidence_capture}
              onCheckedChange={(checked) => updateConfig('auto_evidence_capture', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Telegram Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Telegram Notifications</h3>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="telegram-enabled" className="text-foreground">Enable Telegram Notifications</Label>
            <Switch
              id="telegram-enabled"
              checked={localConfig.telegram_notifications_enabled}
              onCheckedChange={(checked) => updateConfig('telegram_notifications_enabled', checked)}
            />
          </div>

          {localConfig.telegram_notifications_enabled && (
            <div className="space-y-4 pl-4 border-l-2 border-primary/20">
              <div className="space-y-2">
                <Label htmlFor="bot-token" className="text-foreground">Bot Token</Label>
                <Input
                  id="bot-token"
                  type="password"
                  placeholder="Enter your Telegram bot token"
                  value={localConfig.telegram_bot_token || ''}
                  onChange={(e) => updateConfig('telegram_bot_token', e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="chat-id" className="text-foreground">Chat ID</Label>
                <Input
                  id="chat-id"
                  placeholder="Enter your Telegram chat ID"
                  value={localConfig.telegram_chat_id || ''}
                  onChange={(e) => updateConfig('telegram_chat_id', e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>
              
              <p className="text-sm text-muted-foreground">
                Create a Telegram bot with @BotFather and get your chat ID to receive instant alerts
              </p>
            </div>
          )}
        </div>

        <Separator />

        <Button 
          onClick={handleSave} 
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
};