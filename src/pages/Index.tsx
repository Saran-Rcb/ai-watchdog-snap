import AIProctor from "@/components/AIProctor";
import MCQTest from "@/components/MCQTest";

const Index = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">AI Proctored MCQ Test</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Proctoring Feed</h2>
          <AIProctor />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">MCQ Test</h2>
          <MCQTest />
        </div>
      </div>
    </div>
  );
};

export default Index;