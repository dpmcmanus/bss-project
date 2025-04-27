
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Mock data for completed books
const mockCompletedBooks = [
  {
    id: "1",
    title: "Foundation",
    author: "Isaac Asimov",
    hasReviewed: true
  },
  {
    id: "2",
    title: "Neuromancer",
    author: "William Gibson",
    hasReviewed: false
  },
  {
    id: "3",
    title: "The Martian",
    author: "Andy Weir",
    hasReviewed: false
  }
];

// Mock data for reviews
const mockReviews = [
  {
    id: "1",
    bookId: "1",
    bookTitle: "Foundation",
    bookAuthor: "Isaac Asimov",
    rating: 4,
    text: "A fascinating look at the future of humanity spanning centuries. Asimov's vision of psychohistory and the ability to predict the behavior of large populations is thought-provoking, even if some of the character development feels thin by modern standards.",
    reviewer: "You",
    date: "April 12, 2023"
  },
  {
    id: "2",
    bookId: "1",
    bookTitle: "Foundation",
    bookAuthor: "Isaac Asimov",
    rating: 5,
    text: "A masterpiece of science fiction that continues to resonate today. The concept of psychohistory and the fall and rise of civilizations makes for an epic story spanning generations.",
    reviewer: "John Doe",
    date: "April 10, 2023"
  },
  {
    id: "3",
    bookId: "1",
    bookTitle: "Foundation",
    bookAuthor: "Isaac Asimov",
    rating: 3,
    text: "While the concepts are brilliant, I found some of the writing and character development a bit dated. Still an important read for any sci-fi fan.",
    reviewer: "Jane Smith",
    date: "April 15, 2023"
  }
];

const ClubReviews = () => {
  const [reviews, setReviews] = useState(mockReviews);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<(typeof mockCompletedBooks)[0] | null>(null);
  const [newReview, setNewReview] = useState({
    rating: 0,
    text: ""
  });
  const { toast } = useToast();

  const openReviewDialog = (book: typeof selectedBook) => {
    setSelectedBook(book);
    setNewReview({ rating: 0, text: "" });
    setIsDialogOpen(true);
  };

  const handleRatingClick = (rating: number) => {
    setNewReview({ ...newReview, rating });
  };

  const handleSubmitReview = () => {
    if (!selectedBook) return;
    
    // Add the new review
    const review = {
      id: Date.now().toString(),
      bookId: selectedBook.id,
      bookTitle: selectedBook.title,
      bookAuthor: selectedBook.author,
      rating: newReview.rating,
      text: newReview.text,
      reviewer: "You",
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };
    
    setReviews([review, ...reviews]);
    
    // Close the dialog and show success message
    setIsDialogOpen(false);
    
    toast({
      title: "Review submitted",
      description: `Your review for "${selectedBook.title}" has been added.`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Completed Books Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Write a Review</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {mockCompletedBooks.map((book) => (
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
        
        {/* Review Dialog */}
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
                disabled={newReview.rating === 0 || !newReview.text.trim()}
              >
                Submit Review
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Reviews List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Reviews</h2>
        
        {reviews.length > 0 ? (
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
