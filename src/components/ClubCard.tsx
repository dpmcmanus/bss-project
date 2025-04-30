
import { Link } from "react-router-dom";
import { Lock, Globe, Book } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  onJoin?: () => void;
  showViewButton?: boolean;
  showMemberCount?: boolean;
};
const ClubCard = ({
  id,
  name,
  description,
  memberCount,
  isPublic = true,
  currentBook,
  showJoin = false,
  onJoin,
  showViewButton = true,
  showMemberCount = false
}: ClubCardProps) => {
  const handleJoin = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onJoin) {
      onJoin();
    }
  };

  // For debugging, explicitly log the memberCount value for this specific club
  console.log(`Club "${name}" memberCount:`, memberCount);
  return <Card className="book-card h-full flex flex-col">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-base line-clamp-1">{name}</h3>
          {isPublic ? <Globe className="h-5 w-5 text-book-500 shrink-0" /> : <Lock className="h-5 w-5 text-book-500 shrink-0" />}
        </div>
      </CardHeader>
      
      <CardContent className="pt-2 pb-0 flex-grow flex flex-col justify-between space-y-4 py-[5px]">
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        
        {currentBook && <div>
            <div className="flex items-center gap-1 mb-1">
              <Book className="h-4 w-4 text-book-500" />
              <span className="text-xs font-medium">Currently Reading</span>
            </div>
            <div className="text-sm font-medium line-clamp-1">{currentBook.title}</div>
            <div className="text-xs text-muted-foreground line-clamp-1 mb-1">{currentBook.author}</div>
            
            {currentBook.goal && <div className="text-xs text-muted-foreground">
                Goal: Chapter {currentBook.goal.chapter} by {currentBook.goal.date}
              </div>}
          </div>}
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="w-full">
          {showViewButton && <Button asChild variant="outline" className="w-full text-book-600 hover:text-book-700 hover:bg-book-50" size="sm">
              <Link to={`/clubs/${id}`}>View Club</Link>
            </Button>}
          {showJoin && onJoin && <Button onClick={handleJoin} size="sm" className="w-full bg-book-600 hover:bg-book-700">
              Join Club
            </Button>}
        </div>
      </CardFooter>
    </Card>;
};
export default ClubCard;
