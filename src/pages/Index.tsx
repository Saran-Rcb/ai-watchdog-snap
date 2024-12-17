import { useState } from "react";
import MCQTest from "@/components/MCQTest";
import AIProctor from "@/components/AIProctor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const Index = () => {
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">AI-Proctored MCQ Test</h1>
      
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
          <AIProctor isActive={testStarted && !testCompleted} />
        </div>
      </div>
    </div>
  );
};

export default Index;