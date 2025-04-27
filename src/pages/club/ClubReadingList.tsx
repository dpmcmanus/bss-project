import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Plus } from "lucide-react";
import BookCard from "@/components/BookCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type ClubContextType = {
  club: {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    currentBook: {
      id: string;
      title: string;
      author: string;
      goal?: {
        chapter: number;
        date: string;
      };
    };
  };
};

// Mock data for past books
const mockPastBooks = [
  {
    id: "1",
    title: "Foundation",
    author: "Isaac Asimov",
    rating: 4,
  },
  {
    id: "2",
    title: "Neuromancer",
    author: "William Gibson",
    rating: 5,
  },
  {
    id: "3",
    title: "The Martian",
    author: "Andy Weir",
    rating: 4,
  }
];

const ClubReadingList = () => {
  const { club } = useOutletContext<ClubContextType>();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    totalChapters: "",
    goalDate: ""
  });
  const { toast } = useToast();

  const handleAddBook = () => {
    // In a real app, this would save to a backend
    toast({
      title: "Book added",
      description: `${newBook.title} has been added to the reading list.`,
    });
    
    setNewBook({
      title: "",
      author: "",
      totalChapters: "",
      goalDate: ""
    });
    
    setIsAddDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Current Book */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Currently Reading</h2>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-book-600 hover:bg-book-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Book
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a New Book</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="book-title">Book Title</Label>
                    <Input
                      id="book-title"
                      placeholder="Enter book title"
                      value={newBook.title}
                      onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="book-author">Author</Label>
                    <Input
                      id="book-author"
                      placeholder="Enter author name"
                      value={newBook.author}
                      onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="total-chapters">Total Chapters</Label>
                      <Input
                        id="total-chapters"
                        type="number"
                        placeholder="e.g. 12"
                        value={newBook.totalChapters}
                        onChange={(e) => setNewBook({ ...newBook, totalChapters: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="goal-date">Goal Date</Label>
                      <Input
                        id="goal-date"
                        type="date"
                        value={newBook.goalDate}
                        onChange={(e) => setNewBook({ ...newBook, goalDate: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-book-600 hover:bg-book-700"
                    onClick={handleAddBook}
                    disabled={!newBook.title.trim() || !newBook.author.trim()}
                  >
                    Add Book
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex items-start space-x-4">
            <BookOpen className="h-10 w-10 text-book-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{club.currentBook.title}</h3>
              <p className="text-muted-foreground">{club.currentBook.author}</p>
              
              {club.currentBook.goal && (
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Goal</span>
                  <span>
                    Chapter {club.currentBook.goal.chapter} by {club.currentBook.goal.date}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Past Books */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Previously Read</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockPastBooks.map((book) => (
            <BookCard key={book.id} {...book} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClubReadingList;
