
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ClubCard from "@/components/ClubCard";
import ClubInvitationList from "@/components/ClubInvitationList";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClub, setNewClub] = useState({
    name: "",
    description: "",
    isPublic: true
  });
  const [myClubs, setMyClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingClub, setIsCreatingClub] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (user) {
      fetchMyClubs();
    }
  }, [user]);
  
  useEffect(() => {
    if (!user?.email) return;

    // Set up realtime subscriptions for multiple tables that might affect the dashboard
    
    // Listen for club_invitations changes
    const invitationsChannel = supabase
      .channel('dashboard_invitations_changes')
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'club_invitations',
        },
        (payload) => {
          console.log("Club invitation change detected:", payload.eventType);
          
          // For all events, refresh the invitations list
          const invitationList = document.querySelector('.club-invitation-list');
          if (invitationList) {
            console.log("Triggering invitation list refresh");
            // Force a refresh by rerendering the component
            invitationList.classList.add('refreshed');
            setTimeout(() => {
              invitationList.classList.remove('refreshed');
            }, 100);
          }
          
          // For insert/delete events, also refresh clubs if needed
          if (payload.eventType === 'DELETE') {
            fetchMyClubs(); // Refresh clubs when an invitation is accepted/declined
          }
        }
      )
      .subscribe();
      
    // Listen for club_members changes
    const membersChannel = supabase
      .channel('dashboard_members_changes')
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'club_members',
        },
        () => {
          console.log("Club member change detected");
          fetchMyClubs(); // Refresh clubs when membership changes
        }
      )
      .subscribe();
      
    // Listen for clubs changes
    const clubsChannel = supabase
      .channel('dashboard_clubs_changes')
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'clubs',
        },
        () => {
          console.log("Club change detected");
          fetchMyClubs(); // Refresh clubs when details change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(invitationsChannel);
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(clubsChannel);
    };
  }, [user?.email]);
  
  const fetchMyClubs = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      console.log("Fetching clubs for user:", user.id);
      
      const { data: memberData, error: memberError } = await supabase
        .from('club_members')
        .select('club_id')
        .eq('profile_id', user.id);
        
      if (memberError) {
        console.error("Error fetching club memberships:", memberError);
        throw memberError;
      }
      
      if (!memberData || memberData.length === 0) {
        setMyClubs([]);
        setIsLoading(false);
        return;
      }
      
      const clubIds = memberData.map(item => item.club_id);
      
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs')
        .select('*')
        .in('id', clubIds);
        
      if (clubsError) {
        console.error("Error fetching clubs:", clubsError);
        throw clubsError;
      }
      
      const clubsWithData = await Promise.all(
        clubsData.map(async (club) => {
          const { count: memberCount, error: countError } = await supabase
            .from('club_members')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.id);
          
          if (countError) {
            console.error("Error fetching member count:", countError);
          }
            
          const { data: bookData, error: bookError } = await supabase
            .from('club_books')
            .select(`
              book:books (
                id,
                title,
                author
              ),
              goal_chapter,
              goal_date
            `)
            .eq('club_id', club.id)
            .eq('is_current', true)
            .maybeSingle();
          
          if (bookError && bookError.code !== 'PGRST116') {
            console.error("Error fetching book data:", bookError);
          }
            
          return {
            id: club.id,
            name: club.name,
            description: club.description,
            isPublic: club.is_public,
            memberCount: memberCount || 0,
            currentBook: bookData ? {
              id: bookData.book.id,
              title: bookData.book.title,
              author: bookData.book.author,
              goal: bookData.goal_chapter || bookData.goal_date ? {
                chapter: bookData.goal_chapter,
                date: bookData.goal_date ? new Date(bookData.goal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : undefined
              } : undefined
            } : undefined
          };
        })
      );
      
      setMyClubs(clubsWithData.filter(Boolean));
    } catch (error) {
      console.error("Error fetching clubs:", error);
      toast({
        title: "Error",
        description: "Failed to load your book clubs.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateClub = async () => {
    if (!user?.id) return;
    
    try {
      setIsCreatingClub(true);
      
      console.log("Creating club with settings:", {
        name: newClub.name,
        description: newClub.description,
        is_public: newClub.isPublic,
        created_by: user.id
      });
      
      const { data, error } = await supabase
        .rpc('create_club', {
          club_name: newClub.name,
          club_description: newClub.description,
          club_is_public: newClub.isPublic
        });
      
      if (error) {
        console.error("Error creating club:", error);
        throw error;
      }
      
      toast({
        title: "Club created",
        description: `${newClub.name} has been created successfully.`,
      });
      
      setNewClub({
        name: "",
        description: "",
        isPublic: true
      });
      
      setIsCreateDialogOpen(false);
      
      fetchMyClubs();
    } catch (error) {
      console.error("Error creating club:", error);
      toast({
        title: "Error",
        description: "Failed to create the club. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingClub(false);
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-book-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your profile...</p>
      </div>
    </div>;
  }

  if (!user) {
    return <div className="text-center p-8">
      <p className="text-muted-foreground mb-4">You need to be logged in to view this page.</p>
      <Button onClick={() => window.location.href = '/signin'}>Sign In</Button>
    </div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.name || 'Reader'}</p>
      </div>
      
      <div className="club-invitation-list">
        <ClubInvitationList />
      </div>
      
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Book Clubs</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-book-600 hover:bg-book-700">
              <Plus className="h-4 w-4 mr-1" />
              Create New Club
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Book Club</DialogTitle>
              <DialogDescription>
                Create a club and invite others to join your reading journey.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="club-name">Club Name</Label>
                <Input
                  id="club-name"
                  placeholder="e.g. Classic Literature"
                  value={newClub.name}
                  onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="club-description">Description</Label>
                <Textarea
                  id="club-description"
                  placeholder="What kind of books will your club read?"
                  value={newClub.description}
                  onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={newClub.isPublic}
                  onCheckedChange={(checked) => setNewClub({ ...newClub, isPublic: checked })}
                />
                <Label htmlFor="public">Make this club public</Label>
              </div>
              
              <Button 
                className="w-full bg-book-600 hover:bg-book-700"
                onClick={handleCreateClub}
                disabled={!newClub.name.trim() || !newClub.description.trim() || isCreatingClub}
              >
                {isCreatingClub ? (
                  <>
                    <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                    Creating...
                  </>
                ) : (
                  "Create Club"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-12">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-book-600 mx-auto mb-4"></div>
              <p>Loading your clubs...</p>
            </div>
          </div>
        ) : myClubs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myClubs.map((club) => (
              <ClubCard key={club.id} {...club} />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border rounded-lg">
            <p className="text-muted-foreground mb-4">You're not a member of any clubs yet.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>Create Your First Club</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
