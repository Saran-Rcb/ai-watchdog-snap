
import { useState } from "react";
import MCQTest from "@/components/MCQTest";
import AIProctor from "@/components/AIProctor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  const handleApiKeySubmit = () => {
    if (!apiKey.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid API key",
      });
      return;
    }
    localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
    toast({
      title: "Success",
      description: "API key saved successfully",
    });
    setApiKey("");
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">AI-Proctored MCQ Test</h1>
      
      <div className="mb-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please enter your Gemini API key to use this application. You can get one from the
            <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 ml-1">
              Google AI Studio
            </a>
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-2">
          <Input
            type="password"
            placeholder="Enter your Gemini API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleApiKeySubmit}>Save Key</Button>
        </div>
      </div>

      {!testStarted && !testCompleted && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This test is monitored by AI. Please ensure your camera and microphone are enabled.
            You will have 30 minutes to complete the test. The test will auto-submit if time runs out.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <MCQTest 
            onTestStart={() => setTestStarted(true)}
            onTestComplete={() => setTestCompleted(true)}
          />
        </div>
        <div className="md:col-span-1">
          <AIProctor />
        </div>
      </div>
    </div>
  );
};

export default Index;
