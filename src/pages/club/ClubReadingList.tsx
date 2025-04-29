
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Plus } from "lucide-react";
import BookCard from "@/components/BookCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ClubType } from "./ClubDetail";

type ClubContextType = {
  club: ClubType;
};

type PastBookType = {
  id: string;
  title: string;
  author: string;
  rating?: number;
};

const ClubReadingList = () => {
  const { club } = useOutletContext<ClubContextType>();
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    totalChapters: "",
    goalDate: ""
  });
  const [pastBooks, setPastBooks] = useState<PastBookType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (club && user) {
      fetchPastBooks();
      checkIfAdmin();
    }
  }, [club, user]);

  const fetchPastBooks = async () => {
    try {
      setIsLoading(true);
      
      // Get past books (not current)
      const { data, error } = await supabase
        .from('club_books')
        .select(`
          book:books (
            id,
            title,
            author
          )
        `)
        .eq('club_id', club.id)
        .eq('is_current_book', false);
        
      if (error) throw error;
      
      // Get average ratings for books
      const booksWithRatings = await Promise.all(
        data.map(async (item) => {
          const { data: reviewData } = await supabase
            .from('book_reviews')
            .select('rating')
            .eq('book_id', item.book.id)
            .eq('club_id', club.id);
            
          const ratings = reviewData?.map(r => r.rating) || [];
          const avgRating = ratings.length > 0 
            ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) 
            : undefined;
            
          return {
            id: item.book.id,
            title: item.book.title,
            author: item.book.author,
            rating: avgRating
          };
        })
      );
      
      setPastBooks(booksWithRatings);
    } catch (error) {
      console.error("Error fetching past books:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select('is_admin')
        .eq('club_id', club.id)
        .eq('profile_id', user?.id)
        .single();
        
      if (error) throw error;
      
      setIsAdmin(data.is_admin);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const handleAddBook = async () => {
    try {
      if (!user?.id) return;
      
      // First, create the book
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .insert({
          title: newBook.title,
          author: newBook.author
        })
        .select()
        .single();
        
      if (bookError) throw bookError;
      
      // Make any current books not current
      if (club.currentBook) {
        await supabase
          .from('club_books')
          .update({ is_current_book: false })
          .eq('club_id', club.id)
          .eq('is_current_book', true);
      }
      
      // Add the book to the club's reading list as current
      const { error: clubBookError } = await supabase
        .from('club_books')
        .insert({
          club_id: club.id,
          book_id: bookData.id,
          is_current_book: true,
          goal_chapter: newBook.totalChapters ? parseInt(newBook.totalChapters) : null,
          goal_date: newBook.goalDate || null,
          added_by: user.id
        });
        
      if (clubBookError) throw clubBookError;
      
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
      
      // Refresh the page data
      window.location.reload();
    } catch (error) {
      console.error("Error adding book:", error);
      toast({
        title: "Error",
        description: "Failed to add the book. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Book */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Currently Reading</h2>
            
            {isAdmin && (
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
            )}
          </div>
          
          {club.currentBook ? (
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
          ) : (
            <p className="text-muted-foreground">No book currently selected.</p>
          )}
        </CardContent>
      </Card>
      
      {/* Past Books */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Previously Read</h2>
        
        {isLoading ? (
          <div className="text-center p-8">Loading books...</div>
        ) : pastBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastBooks.map((book) => (
              <BookCard key={book.id} {...book} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No books have been previously read in this club.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClubReadingList;
