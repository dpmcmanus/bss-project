
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Book as BookIcon, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ClubCard from "@/components/ClubCard";

// Mock data for books
const mockBooks = [
  {
    id: "101",
    title: "Dune",
    author: "Frank Herbert",
    synopsis: "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the \"spice\" melange, a drug capable of extending life and enhancing consciousness. Coveted across the known universe, melange is a prize worth killing for. When House Atreides is betrayed, the destruction of Paul's family will set the boy on a journey toward a destiny greater than he could ever have imagined. And as he evolves into the mysterious man known as Muad'Dib, he will bring to fruition humankind's most ancient and unattainable dream.",
    rating: 4.5,
    reviews: [
      { id: "1", rating: 5, text: "A masterpiece of world-building and political intrigue.", reviewer: "John Doe", date: "March 12, 2023" },
      { id: "2", rating: 4, text: "Complex, challenging, and thought-provoking. Herbert creates an immersive universe with depth and nuance.", reviewer: "Jane Smith", date: "February 28, 2023" }
    ]
  },
  {
    id: "102",
    title: "The Silent Patient",
    author: "Alex Michaelides",
    synopsis: "Alicia Berenson's life is seemingly perfect. A famous painter married to an in-demand fashion photographer, she lives in a grand house with big windows overlooking a park in one of London's most desirable areas. One evening her husband Gabriel returns home late from a fashion shoot, and Alicia shoots him five times in the face, and then never speaks another word. Alicia's refusal to talk, or give any kind of explanation, turns a domestic tragedy into something far grander, a mystery that captures the public imagination and casts Alicia into notoriety.",
    rating: 4.2,
    reviews: [
      { id: "1", rating: 5, text: "An absolute page-turner with a twist I never saw coming.", reviewer: "Mike Johnson", date: "April 5, 2023" },
      { id: "2", rating: 3, text: "Good psychological thriller, though I felt some parts were predictable.", reviewer: "Sarah Parker", date: "April 1, 2023" }
    ]
  }
];

// Mock data for clubs reading this book
const mockClubsReadingBook = (bookId: string) => [
  {
    id: "1",
    name: "Science Fiction Lovers",
    description: "A club dedicated to exploring the vast worlds of science fiction literature.",
    memberCount: 4,
    currentBook: {
      title: "Dune",
      author: "Frank Herbert",
      progress: 45
    }
  },
  {
    id: "5",
    name: "Mystery & Thriller Club",
    description: "For those who enjoy page-turning suspense and clever mysteries.",
    memberCount: 3,
    currentBook: {
      title: "The Silent Patient",
      author: "Alex Michaelides",
      progress: 25
    }
  }
].filter(club => 
  bookId === "101" ? club.currentBook.title === "Dune" : 
  bookId === "102" ? club.currentBook.title === "The Silent Patient" : 
  false
);

const BookDetail = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Find the book from mock data
  const book = mockBooks.find(b => b.id === bookId);
  const clubs = bookId ? mockClubsReadingBook(bookId) : [];
  
  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Redirect to 404 if book not found and not loading
  useEffect(() => {
    if (!isLoading && !book) {
      navigate("/404");
    }
  }, [book, navigate, isLoading]);
  
  if (isLoading) {
    return <BookSkeleton />;
  }
  
  if (!book) return null;

  return (
    <div className="animate-fade-in">
      {/* Book Header */}
      <div className="bg-gradient-to-r from-book-900 to-book-700 text-white p-8 rounded-lg mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-3xl font-bold">{book.title}</h1>
            <p className="text-xl mt-1 text-book-100">by {book.author}</p>
          </div>
          
          <div className="flex items-center mt-4 md:mt-0">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-6 w-6 ${
                  i < Math.floor(book.rating)
                    ? "fill-amber-400 text-amber-400"
                    : i < book.rating
                    ? "fill-amber-400/50 text-amber-400/50"
                    : "text-book-200"
                }`}
              />
            ))}
            <span className="ml-2 text-lg">{book.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Synopsis Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <BookIcon className="h-5 w-5 text-book-600 mr-2" />
                <h2 className="text-xl font-semibold">Synopsis</h2>
              </div>
              <p className="text-muted-foreground whitespace-pre-line">{book.synopsis}</p>
            </CardContent>
          </Card>
          
          {/* Reviews Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Reviews</h2>
            
            {book.reviews.length > 0 ? (
              <div className="space-y-4">
                {book.reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{review.reviewer}</span>
                        <div className="flex">
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
                      
                      <p className="text-sm mt-2">{review.text}</p>
                      
                      <div className="text-xs text-muted-foreground mt-3">
                        {review.date}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No reviews yet for this book.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Clubs Section */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 text-book-600 mr-2" />
              <h2 className="text-xl font-semibold">Clubs Reading This Book</h2>
            </div>
            
            {clubs.length > 0 ? (
              <div className="space-y-4">
                {clubs.map((club) => (
                  <Card key={club.id} className="book-card overflow-hidden">
                    <CardContent className="p-4">
                      <h3 className="font-medium">{club.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{club.description}</p>
                      
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground">
                          {club.memberCount} members
                        </span>
                        <span className="mx-2 text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {club.currentBook.progress}% complete
                        </span>
                      </div>
                      
                      <Button 
                        variant="outline"
                        className="w-full mt-3 text-book-600 hover:text-book-700"
                        onClick={() => navigate(`/clubs/${club.id}`)}
                      >
                        View Club
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-muted-foreground">No clubs are currently reading this book.</p>
                </CardContent>
              </Card>
            )}
          </div>
          
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="font-medium mb-2">Want to read this book?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add it to your reading list or suggest it to your clubs.
              </p>
              <Button className="w-full bg-book-600 hover:bg-book-700">
                Add to My List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const BookSkeleton = () => (
  <div>
    <Skeleton className="h-32 w-full rounded-lg mb-8" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Skeleton className="h-64 w-full mb-8" />
        <Skeleton className="h-48 w-full" />
      </div>
      <div>
        <Skeleton className="h-48 w-full mb-6" />
        <Skeleton className="h-36 w-full" />
      </div>
    </div>
  </div>
);

export default BookDetail;
