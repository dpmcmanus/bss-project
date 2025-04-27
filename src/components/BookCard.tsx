
import { Link } from "react-router-dom";
import { Book as BookIcon } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export type BookCardProps = {
  id: string;
  title: string;
  author: string;
  goal?: {
    chapter: number;
    date: string;
  };
  rating?: number;
  clubId?: string;
  memberCount?: number;
  description?: string;
  showDetailsButton?: boolean;
};

const BookCard = ({ 
  id, 
  title, 
  author, 
  goal, 
  rating, 
  clubId, 
  memberCount, 
  description,
  showDetailsButton = false // Changed default to false
}: BookCardProps) => {
  // Display star rating if available
  const renderRating = () => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <span 
            key={i} 
            className={`text-sm ${i < rating ? 'text-amber-500' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Display goal if available
  const renderGoal = () => {
    if (!goal) return null;
    
    return (
      <div className="mt-2 text-xs text-muted-foreground">
        Goal: Chapter {goal.chapter} by {goal.date}
      </div>
    );
  };

  // Display members if available
  const renderMembers = () => {
    if (!memberCount) return null;
    
    return (
      <div className="flex items-center mt-4">
        <div className="avatar-group mr-2">
          {[...Array(Math.min(3, memberCount))].map((_, i) => (
            <Avatar key={i} className="avatar">
              <AvatarFallback className={`bg-book-${(i * 100) + 100}`}>
                {String.fromCharCode(65 + i)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{memberCount} members</span>
      </div>
    );
  };

  return (
    <Card className="book-card overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-base line-clamp-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{author}</p>
          </div>
          <BookIcon className="h-5 w-5 text-book-500 shrink-0" />
        </div>
        {renderRating()}
      </CardHeader>
      
      <CardContent className="pb-2 flex-grow">
        {description && (
          <p className="text-sm line-clamp-2 text-muted-foreground mb-2">{description}</p>
        )}
        {renderGoal()}
        {renderMembers()}
      </CardContent>
      
      {showDetailsButton && (
        <CardFooter className="pt-0">
          <Button 
            asChild 
            variant="ghost" 
            size="sm" 
            className="w-full text-book-600 hover:text-book-700 hover:bg-book-50"
          >
            <Link to={clubId ? `/clubs/${clubId}` : `/books/${id}`}>
              View Details
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default BookCard;
