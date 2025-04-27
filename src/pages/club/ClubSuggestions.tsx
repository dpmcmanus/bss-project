
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, ChevronDown, ChevronUp, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for book suggestions
const mockSuggestions = [
  {
    id: "1",
    title: "Project Hail Mary",
    author: "Andy Weir",
    reason: "An exciting sci-fi story about a lone astronaut who must save humanity. It's got great science, humor, and heart.",
    votes: 5,
    suggestedBy: "John Doe",
    date: "May 1, 2023"
  },
  {
    id: "2",
    title: "The Three-Body Problem",
    author: "Liu Cixin",
    reason: "An award-winning hard science fiction novel that explores first contact with an alien civilization and humanity's response.",
    votes: 3,
    suggestedBy: "Jane Smith",
    date: "May 3, 2023"
  },
  {
    id: "3",
    title: "Children of Time",
    author: "Adrian Tchaikovsky",
    reason: "A fascinating exploration of evolution and intelligence through the lens of both human and non-human characters.",
    votes: 2,
    suggestedBy: "Mike Johnson",
    date: "May 7, 2023"
  }
];

const ClubSuggestions = () => {
  const [suggestions, setSuggestions] = useState(mockSuggestions);
  const [newSuggestion, setNewSuggestion] = useState({
    title: "",
    author: "",
    reason: ""
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add the new suggestion
    const suggestion = {
      id: Date.now().toString(),
      ...newSuggestion,
      votes: 0,
      suggestedBy: "You",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    
    setSuggestions([suggestion, ...suggestions]);
    
    // Reset the form
    setNewSuggestion({ title: "", author: "", reason: "" });
    
    toast({
      title: "Suggestion added",
      description: `Your suggestion for "${newSuggestion.title}" has been added.`,
    });
  };

  const handleVote = (id: string, direction: 'up' | 'down') => {
    setSuggestions(suggestions.map(suggestion => {
      if (suggestion.id === id) {
        return {
          ...suggestion,
          votes: direction === 'up' 
            ? suggestion.votes + 1 
            : Math.max(0, suggestion.votes - 1)
        };
      }
      return suggestion;
    }));
  };

  const handleDelete = (id: string) => {
    setSuggestions(suggestions.filter(suggestion => suggestion.id !== id));
    
    toast({
      title: "Suggestion removed",
      description: "The book suggestion has been removed.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-8">
      {/* Add Suggestion Form */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Suggest a Book</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Book Title</Label>
                <Input
                  id="title"
                  value={newSuggestion.title}
                  onChange={(e) => setNewSuggestion({ ...newSuggestion, title: e.target.value })}
                  placeholder="Enter book title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={newSuggestion.author}
                  onChange={(e) => setNewSuggestion({ ...newSuggestion, author: e.target.value })}
                  placeholder="Enter author name"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Why should the club read this book?</Label>
              <Textarea
                id="reason"
                value={newSuggestion.reason}
                onChange={(e) => setNewSuggestion({ ...newSuggestion, reason: e.target.value })}
                placeholder="Share what makes this book worth reading..."
                rows={3}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="bg-book-600 hover:bg-book-700"
              disabled={!newSuggestion.title || !newSuggestion.author || !newSuggestion.reason}
            >
              Submit Suggestion
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Suggestions List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Current Suggestions</h2>
        
        {suggestions.length > 0 ? (
          <div className="space-y-4">
            {suggestions
              .sort((a, b) => b.votes - a.votes)
              .map((suggestion) => (
                <Card key={suggestion.id} className="relative">
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      {/* Voting Section */}
                      <div className="flex flex-col items-center mr-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleVote(suggestion.id, 'up')}
                          className="h-8 w-8"
                        >
                          <ChevronUp className="h-5 w-5" />
                        </Button>
                        
                        <span className="text-lg font-medium py-1">{suggestion.votes}</span>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleVote(suggestion.id, 'down')}
                          className="h-8 w-8"
                          disabled={suggestion.votes === 0}
                        >
                          <ChevronDown className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      {/* Content Section */}
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <BookOpen className="h-4 w-4 text-book-600 mr-2" />
                          <h3 className="font-semibold">{suggestion.title}</h3>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">by {suggestion.author}</p>
                        
                        <p className="text-sm mb-3">{suggestion.reason}</p>
                        
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Suggested by {suggestion.suggestedBy}</span>
                          <span>{suggestion.date}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Delete Button (only shown for "your" suggestions) */}
                    {suggestion.suggestedBy === "You" && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={() => handleDelete(suggestion.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No suggestions yet. Be the first to suggest a book!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClubSuggestions;
