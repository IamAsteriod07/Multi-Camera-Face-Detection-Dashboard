import { Shield, Camera, Eye, ArrowRight, CheckCircle, Zap, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        
        <div className="container mx-auto px-6 py-20 relative">
          <div className="text-center space-y-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-3xl flex items-center justify-center animate-pulse-glow">
                <Shield className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground">
                Skylark <span className="text-primary">Security</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Real-time multi-camera face detection dashboard with WebRTC streaming and intelligent monitoring
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                onClick={() => window.location.href = '/login'}
              >
                <Shield className="w-5 h-5 mr-2" />
                Access Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-border text-foreground hover:bg-muted px-8"
                onClick={() => window.location.href = '/dashboard'}
              >
                <Eye className="w-5 h-5 mr-2" />
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold text-foreground">Advanced Surveillance Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built with modern technologies for enterprise-grade security monitoring
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-card/95 backdrop-blur border-border hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Multi-Camera Support</h3>
              <p className="text-muted-foreground">
                Monitor up to 4+ simultaneous RTSP camera streams with real-time WebRTC delivery
              </p>
              <Badge className="bg-success text-success-foreground">Real-time</Badge>
            </CardContent>
          </Card>
          
          <Card className="bg-card/95 backdrop-blur border-border hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mx-auto">
                <Eye className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">AI Face Detection</h3>
              <p className="text-muted-foreground">
                Advanced AI-powered face detection with confidence scoring and real-time overlays
              </p>
              <Badge className="bg-accent text-accent-foreground animate-alert-pulse">AI Powered</Badge>
            </CardContent>
          </Card>
          
          <Card className="bg-card/95 backdrop-blur border-border hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Instant Alerts</h3>
              <p className="text-muted-foreground">
                WebSocket-powered real-time notifications for immediate security response
              </p>
              <Badge className="bg-success text-success-foreground">WebSocket</Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tech Stack Section */}
      <div className="bg-card/30 backdrop-blur border-y border-border">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold text-foreground">Enterprise Tech Stack</h2>
            <p className="text-muted-foreground">
              Built with modern microservices architecture for scalability and reliability
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Frontend</h3>
              <div className="space-y-2">
                <Badge variant="secondary">React + TypeScript</Badge>
                <Badge variant="secondary">Vite + Tailwind CSS</Badge>
                <Badge variant="secondary">WebRTC Streaming</Badge>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Backend API</h3>
              <div className="space-y-2">
                <Badge variant="secondary">Node.js + Hono</Badge>
                <Badge variant="secondary">PostgreSQL + Prisma</Badge>
                <Badge variant="secondary">JWT Authentication</Badge>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success/20 rounded-2xl flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">AI Worker</h3>
              <div className="space-y-2">
                <Badge variant="secondary">Golang + OpenCV</Badge>
                <Badge variant="secondary">FFmpeg Processing</Badge>
                <Badge variant="secondary">Face Recognition</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-20 text-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-foreground">Ready to Secure Your Facility?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience enterprise-grade surveillance with real-time AI detection and monitoring
            </p>
          </div>
          
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 text-lg"
            onClick={() => window.location.href = '/login'}
          >
            <Shield className="w-6 h-6 mr-3" />
            Start Monitoring Now
            <ArrowRight className="w-6 h-6 ml-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
