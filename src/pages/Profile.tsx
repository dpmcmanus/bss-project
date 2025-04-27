
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import BookCard from "@/components/BookCard";
import { useToast } from "@/hooks/use-toast";

// Mock data for favorite books
const mockFavoriteBooks = [
  {
    id: "1",
    title: "The Count of Monte Cristo",
    author: "Alexandre Dumas",
    rating: 5
  },
  {
    id: "2",
    title: "Mortification of Sin",
    author: "John Owen",
    rating: 5
  },
  {
    id: "3",
    title: "Dune",
    author: "Frank Herbert",
    rating: 4
  }
];

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: "Avid reader with a passion for classic literature, science fiction, and philosophical works."
  });
  
  // Handle profile update
  const handleUpdateProfile = () => {
    // In a real app, this would call an API to update the user profile
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
    
    setIsEditing(false);
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-8">My Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <Avatar className="h-20 w-20 mr-4">
                  <AvatarFallback className="bg-book-100 text-book-800 text-xl">
                    {profile.name ? getInitials(profile.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{profile.name}</h2>
                  <p className="text-muted-foreground">{profile.email}</p>
                </div>
              </div>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        disabled
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      className="bg-book-600 hover:bg-book-700"
                      onClick={handleUpdateProfile}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <h3 className="font-medium mb-2">Bio</h3>
                    <p className="text-muted-foreground">{profile.bio}</p>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="text-book-600 border-book-200 hover:bg-book-50"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Reading Statistics */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Reading Statistics</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-book-600">12</div>
                  <div className="text-sm text-muted-foreground">Books Read</div>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-book-600">3</div>
                  <div className="text-sm text-muted-foreground">Active Clubs</div>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-book-600">8</div>
                  <div className="text-sm text-muted-foreground">Reviews Written</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Favorite Books */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Favorite Books</h2>
          <div className="space-y-4">
            {mockFavoriteBooks.map((book) => (
              <BookCard key={book.id} {...book} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
