
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Book } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="text-center">
        <Book className="h-16 w-16 text-book-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
        <p className="text-xl text-muted-foreground mb-8">
          We couldn't find the page you were looking for.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button 
            asChild
            className="bg-book-600 hover:bg-book-700"
          >
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button 
            asChild
            variant="outline" 
            className="border-book-600 text-book-600 hover:bg-book-50"
          >
            <Link to="/explore">Explore Book Clubs</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
