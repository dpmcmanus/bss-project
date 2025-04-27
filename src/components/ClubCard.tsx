import { Link } from "react-router-dom";
import { Lock, Globe } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export type ClubCardProps = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isPublic?: boolean;
  currentBook?: {
    title: string;
    author: string;
    goal?: {
      chapter: number;
      date: string;
    };
  };
  showJoin?: boolean;
};

const ClubCard = ({ 
  id, 
  name, 
  description, 
  memberCount, 
  isPublic = true, 
  currentBook,
  showJoin = false 
}: ClubCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleJoin = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent card click navigation
    toast({
      title: "Joined club",
      description: `You have successfully joined ${name}`,
    });
    navigate('/dashboard');
  };

  return (
    <Card className="book-card h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-base line-clamp-1">{name}</h3>
          {isPublic ? (
            <Globe className="h-5 w-5 text-book-500 shrink-0" />
          ) : (
            <Lock className="h-5 w-5 text-book-500 shrink-0" />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-2 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{description}</p>
        
        <div className="flex items-center mt-2">
          <span className="text-xs text-muted-foreground">{memberCount} members</span>
        </div>
        
        {currentBook && (
          <div className="mt-4">
            <div className="text-sm font-medium">{currentBook.title}</div>
            <div className="text-xs text-muted-foreground mb-2">{currentBook.author}</div>
            
            {currentBook.goal && (
              <div className="mt-2 text-xs text-muted-foreground">
                Goal: Chapter {currentBook.goal.chapter} by {currentBook.goal.date}
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="w-full flex gap-2">
          <Link 
            to={`/clubs/${id}`} 
            className="flex-1 px-4 py-2 text-sm text-center text-book-600 hover:text-book-700 hover:bg-book-50 transition-colors rounded-md"
          >
            View Club
          </Link>
          {showJoin && (
            <Button
              onClick={handleJoin}
              className="flex-1 bg-book-600 hover:bg-book-700"
              size="sm"
            >
              Join Club
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ClubCard;
