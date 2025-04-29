
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: profile?.name || "",
    bio: profile?.bio || ""
  });
  
  const handleUpdateProfile = async () => {
    try {
      if (!user || !profile) return;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          bio: profileData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      await refreshProfile();
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile.",
        variant: "destructive"
      });
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (!profile) {
    return <div className="text-center p-8">Loading profile...</div>;
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">My Profile</h1>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center mb-6">
            <Avatar className="h-20 w-20 mr-4">
              <AvatarFallback className="bg-book-100 text-book-800 text-xl">
                {profileData.name ? getInitials(profileData.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{profileData.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
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
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Bio</h3>
                <p className="text-gray-700">{profileData.bio || "No bio provided yet."}</p>
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
    </div>
  );
};

export default Profile;
