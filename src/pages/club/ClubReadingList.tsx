
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Plus, Edit, Check } from "lucide-react";
import BookCard from "@/components/BookCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    totalChapters: "",
    goalDate: ""
  });
  const [editBook, setEditBook] = useState({
    title: "",
    author: "",
    totalChapters: "",
    goalDate: ""
  });
  const [pastBooks, setPastBooks] = useState<PastBookType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentBook, setCurrentBook] = useState(club?.currentBook);
  const { toast } = useToast();

  useEffect(() => {
    if (club && user) {
      fetchPastBooks();
      checkIfAdmin();
      setCurrentBook(club.currentBook);
      console.log("Club currentBook set:", club.currentBook);
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
      toast({
        title: "Error",
        description: "Failed to load past books.",
        variant: "destructive"
      });
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
        const { error: updateError } = await supabase
          .from('club_books')
          .update({ is_current_book: false })
          .eq('club_id', club.id)
          .eq('is_current_book', true);
          
        if (updateError) throw updateError;
      }
      
      // Add the book to the club's reading list as current
      const { data: clubBookData, error: clubBookError } = await supabase
        .from('club_books')
        .insert({
          club_id: club.id,
          book_id: bookData.id,
          is_current_book: true,
          goal_chapter: newBook.totalChapters ? parseInt(newBook.totalChapters) : null,
          goal_date: newBook.goalDate || null,
          added_by: user.id
        })
        .select();
        
      if (clubBookError) throw clubBookError;
      
      // Update local state with the new current book
      const newCurrentBook = {
        id: bookData.id,
        title: bookData.title,
        author: bookData.author,
        goal: newBook.totalChapters || newBook.goalDate ? {
          chapter: newBook.totalChapters ? parseInt(newBook.totalChapters) : undefined,
          date: newBook.goalDate || undefined
        } : undefined
      };
      
      setCurrentBook(newCurrentBook);
      
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
    } catch (error) {
      console.error("Error adding book:", error);
      toast({
        title: "Error",
        description: "Failed to add the book. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditBook = async () => {
    try {
      if (!user?.id || !currentBook?.id) {
        console.error("Missing user ID or current book ID");
        toast({
          title: "Error",
          description: "Could not identify book or user.",
          variant: "destructive"
        });
        return;
      }

      console.log("Updating book with data:", editBook);
      
      // 1. Update the book details in the books table
      const { error: bookError } = await supabase
        .from('books')
        .update({
          title: editBook.title,
          author: editBook.author
        })
        .eq('id', currentBook.id);
        
      if (bookError) {
        console.error("Error updating book details:", bookError);
        throw bookError;
      }
      
      // 2. Find the club_books entry
      const { data: clubBookData, error: fetchError } = await supabase
        .from('club_books')
        .select('id')
        .eq('club_id', club.id)
        .eq('book_id', currentBook.id)
        .eq('is_current_book', true)
        .maybeSingle();
        
      if (fetchError) {
        console.error("Error fetching club book entry:", fetchError);
        throw fetchError;
      }

      if (!clubBookData) {
        console.error("Club book entry not found");
        throw new Error("Current book entry not found");
      }

      // 3. Update goals in the club_books table
      const { error: updateError } = await supabase
        .from('club_books')
        .update({
          goal_chapter: editBook.totalChapters ? parseInt(editBook.totalChapters) : null,
          goal_date: editBook.goalDate || null
        })
        .eq('id', clubBookData.id);
        
      if (updateError) {
        console.error("Error updating club book goals:", updateError);
        throw updateError;
      }
      
      // 4. Update the local state with the edited book details
      const updatedCurrentBook = {
        id: currentBook.id,
        title: editBook.title,
        author: editBook.author,
        goal: editBook.totalChapters || editBook.goalDate ? {
          chapter: editBook.totalChapters ? parseInt(editBook.totalChapters) : undefined,
          date: editBook.goalDate || undefined
        } : undefined
      };
      
      setCurrentBook(updatedCurrentBook);
      
      toast({
        title: "Book updated",
        description: `${editBook.title} has been updated successfully.`,
      });
      
      // Reset form and close dialog
      setEditBook({
        title: "",
        author: "",
        totalChapters: "",
        goalDate: ""
      });
      
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating book:", error);
      toast({
        title: "Error",
        description: "Failed to update the book. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCompleteBook = async () => {
    if (!currentBook?.id || isCompleting) {
      return;
    }
    
    try {
      setIsCompleting(true);

      console.log("Completing book:", currentBook.id);

      // 1. Find the club_books entry for the current book
      const { data: clubBookData, error: fetchError } = await supabase
        .from('club_books')
        .select('id')
        .eq('club_id', club.id)
        .eq('book_id', currentBook.id)
        .eq('is_current_book', true)
        .maybeSingle();
        
      if (fetchError) {
        console.error("Error fetching club book entry:", fetchError);
        throw fetchError;
      }

      if (!clubBookData) {
        console.error("Club book entry not found");
        throw new Error("Current book entry not found");
      }

      // 2. Update the club_books entry to mark as not current
      const { error: updateError } = await supabase
        .from('club_books')
        .update({ is_current_book: false })
        .eq('id', clubBookData.id);
        
      if (updateError) {
        console.error("Error marking book as completed:", updateError);
        throw updateError;
      }
      
      // 3. Add the completed book to the past books list
      const bookToAdd = {
        id: currentBook.id,
        title: currentBook.title,
        author: currentBook.author,
        rating: undefined
      };
      
      setPastBooks(prev => [bookToAdd, ...prev]);
      
      // 4. Clear the current book in local state
      setCurrentBook(null);
      
      toast({
        title: "Book completed",
        description: `${currentBook.title} has been moved to Previously Read.`,
      });
    } catch (error) {
      console.error("Error completing book:", error);
      toast({
        title: "Error",
        description: "Failed to complete the book. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const openEditDialog = () => {
    if (currentBook) {
      setEditBook({
        title: currentBook.title,
        author: currentBook.author,
        totalChapters: currentBook.goal?.chapter ? String(currentBook.goal.chapter) : "",
        goalDate: currentBook.goal?.date ? 
          new Date(currentBook.goal.date).toISOString().split('T')[0] : ""
      });
      setIsEditDialogOpen(true);
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
              currentBook ? (
                <div className="space-x-2">
                  <Button className="bg-book-600 hover:bg-book-700" onClick={openEditDialog}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-book-600 text-book-600 hover:bg-book-50"
                    onClick={handleCompleteBook}
                    disabled={isCompleting}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {isCompleting ? "Completing..." : "Complete"}
                  </Button>
                </div>
              ) : (
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
              )
            )}
          </div>
          
          {currentBook ? (
            <div className="flex items-start space-x-4">
              <BookOpen className="h-10 w-10 text-book-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{currentBook.title}</h3>
                <p className="text-muted-foreground">{currentBook.author}</p>
                
                {currentBook.goal && (
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Goal</span>
                    <span>
                      {currentBook.goal.chapter && `Chapter ${currentBook.goal.chapter}`}
                      {currentBook.goal.chapter && currentBook.goal.date && ' by '}
                      {currentBook.goal.date && currentBook.goal.date}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Current Book</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-book-title">Book Title</Label>
              <Input
                id="edit-book-title"
                placeholder="Enter book title"
                value={editBook.title}
                onChange={(e) => setEditBook({ ...editBook, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-book-author">Author</Label>
              <Input
                id="edit-book-author"
                placeholder="Enter author name"
                value={editBook.author}
                onChange={(e) => setEditBook({ ...editBook, author: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-total-chapters">Total Chapters</Label>
                <Input
                  id="edit-total-chapters"
                  type="number"
                  placeholder="e.g. 12"
                  value={editBook.totalChapters}
                  onChange={(e) => setEditBook({ ...editBook, totalChapters: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-goal-date">Goal Date</Label>
                <Input
                  id="edit-goal-date"
                  type="date"
                  value={editBook.goalDate}
                  onChange={(e) => setEditBook({ ...editBook, goalDate: e.target.value })}
                />
              </div>
            </div>
            
            <Button 
              className="w-full bg-book-600 hover:bg-book-700"
              onClick={handleEditBook}
              disabled={!editBook.title.trim() || !editBook.author.trim()}
            >
              Update Book
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
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
