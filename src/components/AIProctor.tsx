import React, { useRef, useState, useEffect } from 'react';
import { Camera, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const AIProctor = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [referencePhotos, setReferencePhotos] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [lastWarningTime, setLastWarningTime] = useState(0);
  const { toast } = useToast();

  // Initialize webcam
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
        toast({
          title: "Camera Error",
          description: "Unable to access webcam. Please check permissions.",
          variant: "destructive",
        });
      }
    };

    initializeCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const photoData = canvasRef.current.toDataURL('image/jpeg');
        
        if (referencePhotos.length < 3) {
          setReferencePhotos(prev => [...prev, photoData]);
          toast({
            title: "Photo Captured",
            description: `Reference photo ${referencePhotos.length + 1}/3 captured`,
          });
        }
      }
    }
  };

  const startMonitoring = () => {
    if (referencePhotos.length < 3) {
      toast({
        title: "Error",
        description: "Please capture all 3 reference photos first",
        variant: "destructive",
      });
      return;
    }
    setIsMonitoring(true);
    setWarningCount(0);
    toast({
      title: "Monitoring Started",
      description: "AI Proctor is now monitoring your session",
    });
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    toast({
      title: "Monitoring Stopped",
      description: "AI Proctor monitoring has been stopped",
    });
  };

  // Enhanced AI detection simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMonitoring) {
      interval = setInterval(() => {
        if (canvasRef.current && videoRef.current) {
          const context = canvasRef.current.getContext('2d');
          if (context) {
            // Capture current frame
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0);
            
            // Simulate AI detection with more sophisticated logic
            const currentTime = Date.now();
            const timeSinceLastWarning = currentTime - lastWarningTime;
            
            // Random detection with cooldown and increasing probability
            const baseDetectionProbability = 0.3; // 30% base chance
            const timeFactorMultiplier = Math.min(timeSinceLastWarning / 10000, 1); // Increases over 10 seconds
            const finalProbability = baseDetectionProbability * timeFactorMultiplier;

            if (Math.random() < finalProbability) {
              setWarningCount(prev => {
                const newCount = prev + 1;
                if (newCount >= 20) {
                  toast({
                    title: "Session Terminated",
                    description: "Maximum warnings reached. Closing session.",
                    variant: "destructive",
                  });
                  setTimeout(() => window.close(), 2000);
                  return prev;
                }
                setLastWarningTime(currentTime);
                toast({
                  title: "Warning",
                  description: `Suspicious activity detected! Warning ${newCount}/20`,
                  variant: "destructive",
                });
                return newCount;
              });
            }
          }
        }
      }, 2000); // Check every 2 seconds
    }
    return () => clearInterval(interval);
  }, [isMonitoring, lastWarningTime]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg border border-gray-200"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={capturePhoto}
            disabled={referencePhotos.length >= 3 || isMonitoring}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Capture Reference Photo ({referencePhotos.length}/3)
          </Button>
          <Button
            onClick={startMonitoring}
            disabled={referencePhotos.length < 3 || isMonitoring}
            variant="secondary"
          >
            Start Monitoring
          </Button>
          <Button
            onClick={stopMonitoring}
            disabled={!isMonitoring}
            variant="destructive"
          >
            Stop Monitoring
          </Button>
        </div>

        {warningCount > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Warning count: {warningCount}/20
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-3 gap-4">
          {referencePhotos.map((photo, index) => (
            <div key={index} className="relative">
              <img
                src={photo}
                alt={`Reference ${index + 1}`}
                className="w-full rounded-lg border border-gray-200"
              />
              <span className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-sm">
                Reference {index + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIProctor;