import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookOpen, Plus, LogOut, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import type { ClubType } from "./ClubDetail";

type ClubMember = {
  id: string;
  name: string;
  is_admin?: boolean;
};

type ClubContextType = {
  club: ClubType;
};

// New type for club invitations
type ClubInvitation = {
  id: string;
  email: string;
  club_id: string;
  created_at: string;
};

const ClubOverview = () => {
  const navigate = useNavigate();
  const { club } = useOutletContext<ClubContextType>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [invitations, setInvitations] = useState<ClubInvitation[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    if (club) {
      fetchClubMembers();
      fetchClubInvitations();
    }
  }, [club]);
  
  useEffect(() => {
    if (!club?.id) return;
    
    // Set up realtime subscription for club_invitations with more specific filter
    const invitationsChannel = supabase
      .channel('club_invitations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_invitations',
          filter: `club_id=eq.${club.id}`
        },
        () => {
          console.log("Club invitation change detected for club:", club.id);
          fetchClubInvitations();
        }
      )
      .subscribe();
      
    // Also listen for club_members changes to keep the members list up to date
    const membersChannel = supabase
      .channel('club_members_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_members',
          filter: `club_id=eq.${club.id}`
        },
        () => {
          console.log("Club member change detected for club:", club.id);
          fetchClubMembers();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(invitationsChannel);
      supabase.removeChannel(membersChannel);
    };
  }, [club?.id]);
  
  const fetchClubMembers = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('club_members')
        .select(`
          id,
          is_admin,
          profile:profiles (
            id,
            name
          )
        `)
        .eq('club_id', club.id);
        
      if (error) throw error;
      
      const formattedMembers = data.map((member) => ({
        id: member.profile.id,
        name: member.profile.name,
        is_admin: member.is_admin
      }));
      
      setMembers(formattedMembers);

      // Check if current user is an admin
      if (user) {
        const isAdmin = formattedMembers.some(member => 
          member.id === user.id && member.is_admin
        );
        setIsCurrentUserAdmin(isAdmin);
      }
    } catch (error) {
      console.error("Error fetching club members:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchClubInvitations = async () => {
    if (!club.id) return;

    try {
      const { data, error } = await supabase
        .from('club_invitations')
        .select('*')
        .eq('club_id', club.id);

      if (error) {
        console.error("Error fetching club invitations:", error);
        throw error;
      }
      
      setInvitations(data || []);
    } catch (error) {
      console.error("Error fetching club invitations:", error);
    }
  };
  
  const handleInvite = async () => {
    if (!inviteEmail || !club.id || !user) return;
    
    try {
      setIsInviting(true);
      
      // Check if invitation already exists
      const { data: existingInvite, error: inviteCheckError } = await supabase
        .from('club_invitations')
        .select('id')
        .eq('club_id', club.id)
        .ilike('email', inviteEmail)
        .single();

      if (inviteCheckError && inviteCheckError.code !== 'PGRST116') {
        console.error("Error checking for existing invitation:", inviteCheckError);
        throw inviteCheckError;
      }

      if (existingInvite) {
        toast({
          title: "Invitation already sent",
          description: "An invitation has already been sent to this email.",
          variant: "destructive"
        });
        setInviteEmail("");
        return;
      }

      // Check if there are any club members with emails matching the invite email
      // Since we can't access auth directly, we'll rely on club_members + profiles to check
      const { data: existingMembers, error: membersError } = await supabase
        .from('club_members')
        .select(`
          id,
          profile_id
        `)
        .eq('club_id', club.id);
      
      if (membersError) {
        console.error("Error checking for existing members:", membersError);
        throw membersError;
      }

      if (existingMembers && existingMembers.length > 0) {
        // Now we need to check if any of these profile_ids correspond to the email being invited
        // Unfortunately, we can't directly query auth.users from the client
        // As a workaround, we'll create the invitation anyway - the backend RLS will handle
        // ensuring the right user can accept it based on their email
        
        console.log("Proceeding with invitation - membership check will happen when user accepts");
      }

      // Create invitation
      const { error: inviteError } = await supabase
        .from('club_invitations')
        .insert({
          club_id: club.id,
          email: inviteEmail.toLowerCase(),
          invited_by: user.id
        });

      if (inviteError) {
        console.error("Error creating invitation:", inviteError);
        throw inviteError;
      }
      
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${inviteEmail}.`,
      });
      
      setInviteEmail("");
      // The realtime subscription will automatically update invitations
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleLeaveClub = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', club.id)
        .eq('profile_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "You have left the club.",
      });
      
      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error("Error leaving club:", error);
      toast({
        title: "Error",
        description: "Failed to leave the club.",
        variant: "destructive"
      });
    } finally {
      setShowLeaveDialog(false);
    }
  };

  // Updated function to handle club deletion using the database function
  const handleDeleteClub = async () => {
    if (!user || !isCurrentUserAdmin) return;
    
    try {
      setIsDeleting(true);
      
      // Call the delete_club database function
      const { data, error } = await supabase
        .rpc('delete_club', { 
          p_club_id: club.id 
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Club has been deleted successfully.",
      });
      
      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error("Error deleting club:", error);
      toast({
        title: "Error",
        description: "Failed to delete the club. Please try again.",
        variant: "destructive"
      });
      setIsDeleting(false);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column */}
      <div className="md:col-span-2 space-y-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">About this Club</h2>
            <p className="text-muted-foreground">{club.description}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Currently Reading</h2>
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
              <p className="text-muted-foreground">No book currently selected. Add one from the Reading List tab.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Right Column */}
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Members</h2>
              <span className="text-sm text-muted-foreground">
                {club.memberCount} members
              </span>
            </div>
            
            {isLoading ? (
              <div className="text-center p-4">Loading members...</div>
            ) : (
              <div className="space-y-4">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-book-100 text-book-800">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{member.name}</span>
                    </div>
                    {member.is_admin && (
                      <span className="text-xs bg-book-100 text-book-800 px-2 py-1 rounded">Admin</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 space-y-4">
              <h3 className="font-medium">Invite a new member</h3>
              <div className="flex gap-2">
                <Input 
                  placeholder="Email address" 
                  className="flex-1"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)} 
                  type="email"
                  disabled={isInviting}
                />
                <Button 
                  onClick={handleInvite} 
                  disabled={!inviteEmail || isInviting}
                  className="bg-book-600 hover:bg-book-700"
                >
                  {isInviting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {invitations.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Pending Invitations</h4>
                  <ul className="space-y-2">
                    {invitations.map(invitation => (
                      <li key={invitation.id} className="text-xs text-muted-foreground">
                        {invitation.email} (sent {new Date(invitation.created_at).toLocaleDateString()})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Club Management Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Club Management</h2>
            <div className="space-y-4">
              {/* Leave Club Button - Show only for non-admin members */}
              {user && !isCurrentUserAdmin && (
                <>
                  <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <LogOut className="h-4 w-4 mr-2" />
                        Leave Club
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Leave Club</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to leave this club? You'll need to be invited back to rejoin.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleLeaveClub}>Leave Club</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              
              {/* Delete Club Button - Show only for admin users */}
              {user && isCurrentUserAdmin && (
                <>
                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Club
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Club</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this club? This action cannot be undone and all club data will be permanently removed.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleDeleteClub}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete Club'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClubOverview;
