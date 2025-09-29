import { Shield, Camera, Activity, AlertTriangle, Wifi, WifiOff, User, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface DashboardHeaderProps {
  totalCameras: number;
  activeCameras: number;
  totalAlerts: number;
  isConnected: boolean;
}

export const DashboardHeader = ({ 
  totalCameras, 
  activeCameras, 
  totalAlerts, 
  isConnected 
}: DashboardHeaderProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of Skylark Security",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "There was an error signing you out",
        variant: "destructive",
      });
    }
  };
  return (
    <header className="bg-card/95 backdrop-blur border-b border-border shadow-[var(--shadow-card)]">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center animate-pulse-glow">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Skylark Security</h1>
                <p className="text-sm text-muted-foreground">Real-Time Surveillance Dashboard</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Status Indicators */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {activeCameras}/{totalCameras}
                </span>
                <Badge variant={activeCameras > 0 ? "default" : "secondary"} className="bg-success text-success-foreground">
                  Active
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-foreground">{totalAlerts}</span>
                <Badge variant="secondary" className={totalAlerts > 0 ? "bg-accent text-accent-foreground animate-alert-pulse" : ""}>
                  Alerts
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-success" />
                    <Badge className="bg-success text-success-foreground">
                      Connected
                    </Badge>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-destructive" />
                    <Badge variant="destructive">
                      Disconnected
                    </Badge>
                  </>
                )}
              </div>
            </div>
            
            {/* System Status */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-muted rounded-lg">
              <Activity className="w-4 h-4 text-success animate-pulse" />
              <span className="text-sm font-medium text-foreground">System Online</span>
            </div>
            
            {/* User Info and Sign Out */}
            <div className="flex items-center gap-4 pl-4 border-l border-border">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {user?.email || "User"}
                </span>
              </div>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2 hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};