import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, ZoomIn, ZoomOut, RotateCw, Maximize2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ImageViewerProps {
  images: string[];
  canUpload: boolean;
}

export function ImageViewer({ images, canUpload }: ImageViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const { toast } = useToast();

  const handleUpload = () => {
    toast({ title: "Upload", description: "Image upload simulated successfully." });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="font-heading text-lg">DICOM Image Viewer</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setRotation((r) => r + 90)}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => { setZoom(1); setRotation(0); }}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {images.length > 0 ? (
            <div className="bg-foreground/5 rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
              <div
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: "transform 0.2s ease",
                }}
              >
                <img
                  src={images[selectedIndex]}
                  alt={`CT Scan slice ${selectedIndex + 1}`}
                  className="max-w-full max-h-[500px] object-contain"
                />
              </div>
            </div>
          ) : (
            <div className="bg-muted rounded-lg flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">No images uploaded yet</p>
                {canUpload && (
                  <Button variant="outline" onClick={handleUpload}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Images
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIndex(i)}
                  className={`w-16 h-16 rounded border-2 overflow-hidden shrink-0 transition-colors ${
                    i === selectedIndex ? "border-primary" : "border-border"
                  }`}
                >
                  <img src={img} alt={`Slice ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {canUpload && (
        <Card>
          <CardContent className="p-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">Upload DICOM Images</p>
              <p className="text-xs text-muted-foreground mt-1">Drag & drop or click to browse (.dcm files)</p>
              <Input type="file" className="hidden" multiple accept=".dcm,.dicom" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
