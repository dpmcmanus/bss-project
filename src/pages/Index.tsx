
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Book } from "lucide-react";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="max-w-4xl w-full px-4 py-8 text-center">
        <div className="flex justify-center mb-6">
          <Book className="h-16 w-16 text-book-600" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
          Welcome to Book Club
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Connect with friends, track your reading progress, and discover new books together.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button 
            size="lg"
            className="bg-book-600 hover:bg-book-700" 
            onClick={() => navigate("/signin")}
          >
            Sign In
          </Button>
          <Button 
            size="lg"
            variant="outline" 
            className="border-book-600 text-book-600 hover:bg-book-50"
            onClick={() => navigate("/signup")}
          >
            Create Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
