import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ClubBook {
  id: string;
  title: string;
  author: string;
  hasReviewed: boolean;
}

interface BookReview {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  rating: number;
  text: string;
  reviewer: string;
  date: string;
}

const ClubReviews = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<ClubBook | null>(null);
  const [newReview, setNewReview] = useState({
    rating: 0,
    text: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { 
    data: completedBooks, 
    isLoading: loadingBooks,
    error: booksError
  } = useQuery({
    queryKey: ['clubBooks', clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_books')
        .select(`
          id,
          book_id,
          books:book_id (
            id,
            title,
            author
          )
        `)
        .eq('club_id', clubId);
      
      if (error) throw error;
      
      const booksWithReviewStatus: ClubBook[] = [];
      
      for (const book of data) {
        const { data: existingReview } = await supabase
          .from('book_reviews')
          .select('id')
          .eq('book_id', book.book_id)
          .eq('profile_id', user?.id)
          .eq('club_id', clubId);
        
        booksWithReviewStatus.push({
          id: book.book_id,
          title: book.books.title,
          author: book.books.author,
          hasReviewed: existingReview && existingReview.length > 0
        });
      }
      
      return booksWithReviewStatus;
    },
    enabled: !!clubId && !!user?.id,
  });

  const {
    data: reviews,
    isLoading: loadingReviews,
    error: reviewsError
  } = useQuery({
    queryKey: ['bookReviews', clubId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_reviews')
        .select(`
          id,
          book_id,
          profile_id,
          rating,
          review_text,
          created_at,
          books:book_id (
            id,
            title,
            author
          ),
          profiles:profile_id (
            name
          )
        `)
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(review => ({
        id: review.id,
        bookId: review.book_id,
        bookTitle: review.books.title,
        bookAuthor: review.books.author,
        rating: review.rating,
        text: review.review_text,
        reviewer: review.profiles.name || 'Anonymous User',
        date: new Date(review.created_at).toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })
      }));
    },
    enabled: !!clubId,
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: {
      bookId: string;
      rating: number;
      text: string;
    }) => {
      const { data: existingReview } = await supabase
        .from('book_reviews')
        .select('id')
        .eq('book_id', reviewData.bookId)
        .eq('profile_id', user?.id)
        .eq('club_id', clubId);
      
      if (existingReview && existingReview.length > 0) {
        const { data, error } = await supabase
          .from('book_reviews')
          .update({
            rating: reviewData.rating,
            review_text: reviewData.text,
          })
          .eq('id', existingReview[0].id)
          .select();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('book_reviews')
          .insert({
            book_id: reviewData.bookId,
            profile_id: user?.id,
            club_id: clubId,
            rating: reviewData.rating,
            review_text: reviewData.text,
          })
          .select();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookReviews', clubId] });
      queryClient.invalidateQueries({ queryKey: ['clubBooks', clubId] });
      
      setIsDialogOpen(false);
      
      toast({
        title: "Review submitted",
        description: `Your review for "${selectedBook?.title}" has been added.`,
      });
    },
    onError: (error) => {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "There was an error submitting your review. Please try again.",
        variant: "destructive",
      });
    }
  });

  const openReviewDialog = (book: ClubBook) => {
    setSelectedBook(book);
    
    if (book.hasReviewed && user?.id) {
      supabase
        .from('book_reviews')
        .select('rating, review_text')
        .eq('book_id', book.id)
        .eq('profile_id', user.id)
        .eq('club_id', clubId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setNewReview({
              rating: data.rating,
              text: data.review_text
            });
          } else {
            setNewReview({ rating: 0, text: "" });
          }
        });
    } else {
      setNewReview({ rating: 0, text: "" });
    }
    
    setIsDialogOpen(true);
  };

  const handleRatingClick = (rating: number) => {
    setNewReview({ ...newReview, rating });
  };

  const handleSubmitReview = () => {
    if (!selectedBook || !user?.id) return;
    
    submitReviewMutation.mutate({
      bookId: selectedBook.id,
      rating: newReview.rating,
      text: newReview.text
    });
  };

  if (booksError || reviewsError) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive">Error loading reviews. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Write a Review</h2>
        
        {loadingBooks ? (
          <div className="flex justify-center p-6">
            <p>Loading books...</p>
          </div>
        ) : completedBooks && completedBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {completedBooks.map((book) => (
              <Card key={book.id} className="book-card overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{book.title}</h3>
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                    </div>
                    <BookOpen className="h-5 w-5 text-book-500" />
                  </div>
                  
                  <Button
                    onClick={() => openReviewDialog(book)}
                    variant={book.hasReviewed ? "outline" : "default"}
                    className={`w-full mt-4 ${!book.hasReviewed ? 'bg-book-600 hover:bg-book-700' : ''}`}
                  >
                    {book.hasReviewed ? "Edit Review" : "Write Review"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No books have been added to this club yet.</p>
            </CardContent>
          </Card>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedBook ? `Review: ${selectedBook.title}` : "Write a Review"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Your Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant="ghost"
                      className="p-1 h-10 w-10"
                      onClick={() => handleRatingClick(rating)}
                    >
                      <Star
                        className={`h-6 w-6 ${
                          rating <= newReview.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="review">Your Review</Label>
                <Textarea
                  id="review"
                  value={newReview.text}
                  onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                  placeholder="Share your thoughts about this book..."
                  rows={5}
                />
              </div>
              
              <Button
                className="w-full bg-book-600 hover:bg-book-700"
                onClick={handleSubmitReview}
                disabled={newReview.rating === 0 || !newReview.text.trim() || submitReviewMutation.isPending}
              >
                {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Reviews</h2>
        
        {loadingReviews ? (
          <div className="flex justify-center p-6">
            <p>Loading reviews...</p>
          </div>
        ) : reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{review.bookTitle}</h3>
                      <p className="text-sm text-muted-foreground">{review.bookAuthor}</p>
                    </div>
                    
                    <div className="flex mt-2 sm:mt-0">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? "fill-amber-500 text-amber-500" : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-sm mt-3">{review.text}</p>
                  
                  <div className="flex justify-between text-xs text-muted-foreground mt-4">
                    <span>Reviewed by {review.reviewer}</span>
                    <span>{review.date}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No reviews yet. Be the first to review a book!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClubReviews;
