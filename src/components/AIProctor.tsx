import React, { useRef, useState, useEffect } from 'react';
import { Camera, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import VideoFeed from './VideoFeed';
import ReferencePhotos from './ReferencePhotos';
import { detectVoiceActivity, detectVisualAnomaly } from '@/utils/detectionUtils';

const AIProctor = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [referencePhotos, setReferencePhotos] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [lastWarningTime, setLastWarningTime] = useState(0);
  const { toast } = useToast();

  // Initialize webcam and audio
  useEffect(() => {
    const initializeDevices = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: true 
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Initialize audio analysis
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;

      } catch (error) {
        console.error('Error accessing devices:', error);
        toast({
          title: "Error",
          description: "Unable to access camera or microphone. Please check permissions.",
          variant: "destructive",
        });
      }
    };

    initializeDevices();
    return () => {
      stopAllDevices();
    };
  }, []);

  const stopAllDevices = () => {
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

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

  const startMonitoring = async () => {
    if (referencePhotos.length < 3) {
      toast({
        title: "Error",
        description: "Please capture all 3 reference photos first",
        variant: "destructive",
      });
      return;
    }

    // If devices were stopped, reinitialize them
    if (!streamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: true 
        });
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;
      } catch (error) {
        console.error('Error reinitializing devices:', error);
        toast({
          title: "Error",
          description: "Unable to restart camera or microphone. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }
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
    stopAllDevices();
    toast({
      title: "Monitoring Stopped",
      description: "AI Proctor monitoring has been stopped",
    });
  };

  const handleWarning = (reason: string) => {
    setWarningCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 10) {
        toast({
          title: "Session Terminated",
          description: "Maximum warnings reached. Closing session.",
          variant: "destructive",
        });
        setTimeout(() => window.close(), 2000);
        return prev;
      }
      setLastWarningTime(Date.now());
      toast({
        title: "Warning",
        description: `Suspicious activity detected: ${reason}! Warning ${newCount}/10`,
        variant: "destructive",
      });
      return newCount;
    });
  };

  // Enhanced AI detection with voice monitoring
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMonitoring && analyserRef.current) {
      interval = setInterval(() => {
        // Check for voice activity
        const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount);
        analyserRef.current!.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalizedAverage = average / 256; // Normalize to 0-1 range

        if (detectVoiceActivity(normalizedAverage)) {
          handleWarning("Voice detected");
        }

        // Visual detection
        if (canvasRef.current && videoRef.current) {
          const context = canvasRef.current.getContext('2d');
          if (context) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0);
            
            const timeSinceLastWarning = Date.now() - lastWarningTime;
            if (detectVisualAnomaly(timeSinceLastWarning)) {
              handleWarning("Visual anomaly");
            }
          }
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isMonitoring, lastWarningTime]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="space-y-4">
        <VideoFeed videoRef={videoRef} />
        <canvas ref={canvasRef} className="hidden" />

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

        <ReferencePhotos photos={referencePhotos} />
      </div>
    </div>
  );
};

export default AIProctor;