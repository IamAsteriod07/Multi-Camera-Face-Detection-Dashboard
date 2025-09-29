import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Plus, Upload, User, Trash2 } from 'lucide-react';
import { useFaceRecognition } from '@/hooks/useFaceRecognition';
import { useToast } from '@/hooks/use-toast';

export const KnownFacesManager = () => {
  const { knownFaces, addKnownFace, uploadFaceImage, isLoading } = useFaceRecognition();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFace, setNewFace] = useState({
    name: '',
    description: '',
    face_encoding: '',
    photo_url: '',
    is_active: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        // Create preview URL
        const url = URL.createObjectURL(file);
        setNewFace(prev => ({ ...prev, photo_url: url }));
      } else {
        toast({
          title: "Invalid File",
          description: "Please select an image file.",
          variant: "destructive",
        });
      }
    }
  };

  const processFaceEncoding = async (file: File): Promise<string> => {
    // This would normally use a face recognition library or API
    // For demo purposes, we'll generate a mock encoding
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = 128;
        canvas.height = 128;
        ctx?.drawImage(img, 0, 0, 128, 128);
        
        // Mock face encoding - in real implementation, this would be actual face features
        const mockEncoding = Array.from({ length: 128 }, () => Math.random()).join(',');
        resolve(btoa(mockEncoding));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "Missing Image",
        description: "Please select a photo for face recognition.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Process face encoding
      const faceEncoding = await processFaceEncoding(selectedFile);
      
      // Upload image
      const faceId = Date.now().toString();
      const photoUrl = await uploadFaceImage(selectedFile, faceId);
      
      // Add known face
      await addKnownFace({
        ...newFace,
        face_encoding: faceEncoding,
        photo_url: photoUrl || newFace.photo_url,
      });

      // Reset form
      setNewFace({
        name: '',
        description: '',
        face_encoding: '',
        photo_url: '',
        is_active: true,
      });
      setSelectedFile(null);
      setIsDialogOpen(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error adding known face:', error);
      toast({
        title: "Error",
        description: "Failed to add known face. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-foreground">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Known Faces ({knownFaces.length})
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Face
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add New Known Face</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="face-photo" className="text-foreground">Photo</Label>
                  <div className="flex items-center gap-4">
                    {newFace.photo_url && (
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={newFace.photo_url} />
                        <AvatarFallback>
                          <User className="w-8 h-8" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="face-photo"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-border text-foreground"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Select Photo
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="face-name" className="text-foreground">Name</Label>
                  <Input
                    id="face-name"
                    value={newFace.name}
                    onChange={(e) => setNewFace(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter person's name"
                    required
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="face-description" className="text-foreground">Description (Optional)</Label>
                  <Textarea
                    id="face-description"
                    value={newFace.description}
                    onChange={(e) => setNewFace(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Add notes about this person"
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading ? "Adding..." : "Add Face"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="border-border text-foreground"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {knownFaces.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No known faces added yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add faces to enable person identification in your camera feeds
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {knownFaces.map((face) => (
              <Card key={face.id} className="bg-secondary/20 border-border hover:bg-secondary/30 transition-colors">
                <CardContent className="p-3 text-center">
                  <Avatar className="w-16 h-16 mx-auto mb-3">
                    <AvatarImage src={face.photo_url} />
                    <AvatarFallback>
                      <User className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                  <h4 className="font-semibold text-foreground text-sm mb-1">{face.name}</h4>
                  {face.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {face.description}
                    </p>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};