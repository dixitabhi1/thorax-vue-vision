import { useMemo, useRef, useState } from "react";
import { Download, Maximize2, RotateCw, Upload, ZoomIn, ZoomOut } from "lucide-react";
import { StudyFile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ImageViewerProps {
  files: StudyFile[];
  canUpload: boolean;
  onUpload: (files: File[]) => Promise<unknown>;
  uploading: boolean;
}

function isPreviewableImage(file: StudyFile | undefined) {
  if (!file) {
    return false;
  }

  const contentType = file.contentType?.toLowerCase() ?? "";
  const lowerCaseName = file.name.toLowerCase();

  return (
    contentType.startsWith("image/") ||
    lowerCaseName.endsWith(".png") ||
    lowerCaseName.endsWith(".jpg") ||
    lowerCaseName.endsWith(".jpeg")
  );
}

export function ImageViewer({ files, canUpload, onUpload, uploading }: ImageViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const selectedFile = files[selectedIndex];
  const previewable = isPreviewableImage(selectedFile);
  const fileSummary = useMemo(
    () => `${files.length} file${files.length === 1 ? "" : "s"} attached`,
    [files.length],
  );

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (!selectedFiles.length) {
      return;
    }

    await onUpload(selectedFiles);
    event.target.value = "";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="font-heading text-lg">Study Files</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{fileSummary}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setZoom((value) => Math.min(3, value + 0.25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setRotation((value) => value + 90)}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => { setZoom(1); setRotation(0); }}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {files.length > 0 ? (
            <>
              <div className="bg-foreground/5 rounded-lg overflow-hidden flex items-center justify-center min-h-[400px] p-4">
                {previewable && selectedFile?.url ? (
                  <div
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: "transform 0.2s ease",
                    }}
                  >
                    <img
                      src={selectedFile.url}
                      alt={selectedFile.name}
                      className="max-w-full max-h-[500px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Preview is not available for this file type.
                    </p>
                    {selectedFile?.url && (
                      <Button variant="outline" asChild>
                        <a href={selectedFile.url} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download {selectedFile.name}
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {files.map((file, index) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={`text-left rounded-lg border p-3 transition-colors ${
                      index === selectedIndex ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {file.fileType || file.kind || "Study file"}
                      {file.uploadedAt ? ` · ${new Date(file.uploadedAt).toLocaleString()}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-muted rounded-lg flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">No study files uploaded yet</p>
                {canUpload && (
                  <Button variant="outline" onClick={() => uploadInputRef.current?.click()} disabled={uploading}>
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload Study Files"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {canUpload && (
        <Card>
          <CardContent className="p-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">Upload Study Files</p>
              <p className="text-xs text-muted-foreground mt-1">Attach DICOM, ZIP, PNG, or JPEG files</p>
              <input
                ref={uploadInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".dcm,.dicom,.zip,.png,.jpg,.jpeg"
                onChange={handleFileSelection}
              />
              <Button variant="outline" className="mt-4" onClick={() => uploadInputRef.current?.click()} disabled={uploading}>
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : "Browse Files"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
