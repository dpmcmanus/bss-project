
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Define types for club invitations
type ClubInvitation = {
  id: string;
  club_id: string;
  email: string;
  created_at: string;
  club: {
    name: string;
    description: string;
    is_public?: boolean;
  } | null;
};

const ClubInvitationList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<ClubInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingInvites, setProcessingInvites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user?.email) {
      fetchInvitations();
    }
  }, [user]);

  // Set up realtime listeners for changes to invitations
  useEffect(() => {
    if (!user?.email) return;
    
    // Create a channel to listen for changes to club_invitations
    const invitationsChannel = supabase
      .channel('user_invitations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_invitations',
          filter: `email=eq.${user.email.toLowerCase()}`
        },
        (payload) => {
          console.log("Club invitation change detected:", payload);
          fetchInvitations();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(invitationsChannel);
    };
  }, [user?.email]);

  const fetchInvitations = async () => {
    if (!user?.email) return;
    
    try {
      setIsLoading(true);
      
      console.log("Fetching invitations for email:", user.email);
      
      // Get all invitations for the current user's email
      // The RLS policy will ensure they can only see their own invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('club_invitations')
        .select('id, club_id, email, created_at')
        .ilike('email', user.email);
      
      if (invitationsError) {
        console.error("Error fetching invitations:", invitationsError);
        throw invitationsError;
      }
      
      console.log("Raw invitations data:", invitationsData);
      
      if (!invitationsData || invitationsData.length === 0) {
        console.log("No invitations found");
        setInvitations([]);
        setIsLoading(false);
        return;
      }

      // Get club details for each invitation
      const invitationsWithClubs = await Promise.all(
        invitationsData.map(async (invitation) => {
          try {
            console.log("Fetching club data for club ID:", invitation.club_id);
            
            // The RLS policy will ensure they can see club details if they're invited
            const { data: clubData, error: clubError } = await supabase
              .from('clubs')
              .select('name, description, is_public')
              .eq('id', invitation.club_id)
              .single();
            
            if (clubError) {
              console.error(`Error fetching club data for club ${invitation.club_id}:`, clubError);
              return null;
            }
            
            console.log(`Club data for ${invitation.club_id}:`, clubData);
            
            return {
              ...invitation,
              club: clubData
            };
          } catch (err) {
            console.error("Error processing invitation:", err);
            return null;
          }
        })
      );
      
      // Filter out null values from failed club data fetches
      const validInvitations = invitationsWithClubs.filter(Boolean) as ClubInvitation[];
      console.log("Final processed invitations:", validInvitations);
      
      setInvitations(validInvitations);
    } catch (error) {
      console.error("Error in fetchInvitations:", error);
      toast({
        title: "Error",
        description: "Failed to load club invitations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitation: ClubInvitation) => {
    if (!user?.id || !invitation.club) return;

    try {
      setProcessingInvites(prev => ({ ...prev, [invitation.id]: true }));

      console.log("Accepting invitation:", invitation.id, "for club:", invitation.club_id);

      // First check if user is already a member of this club
      const { data: existingMember, error: checkError } = await supabase
        .from('club_members')
        .select('id')
        .eq('club_id', invitation.club_id)
        .eq('profile_id', user.id)
        .maybeSingle();
        
      if (checkError) {
        console.error("Error checking membership:", checkError);
        throw checkError;
      }
      
      // If not already a member, join the club
      if (!existingMember) {
        const { error: joinError } = await supabase
          .from('club_members')
          .insert({
            club_id: invitation.club_id,
            profile_id: user.id
          });

        if (joinError) {
          console.error("Error joining club:", joinError);
          throw joinError;
        }
      }

      // Delete the invitation
      const { error: deleteError } = await supabase
        .from('club_invitations')
        .delete()
        .eq('id', invitation.id);

      if (deleteError) {
        console.error("Error deleting invitation:", deleteError);
        throw deleteError;
      }

      toast({
        title: "Success",
        description: `You've joined "${invitation.club.name}"!`
      });
      
      // Update the local state immediately
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
      
      // Navigate to the club page
      navigate(`/clubs/${invitation.club_id}`);
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: "Failed to join the club",
        variant: "destructive"
      });
    } finally {
      setProcessingInvites(prev => ({ ...prev, [invitation.id]: false }));
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      setProcessingInvites(prev => ({ ...prev, [invitationId]: true }));

      console.log("Declining invitation:", invitationId);

      // Delete the invitation
      const { error } = await supabase
        .from('club_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error("Error declining invitation:", error);
        throw error;
      }

      toast({
        title: "Invitation declined",
        description: "The club invitation has been declined"
      });
      
      // Update the local state immediately
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast({
        title: "Error",
        description: "Failed to decline the invitation",
        variant: "destructive"
      });
    } finally {
      setProcessingInvites(prev => ({ ...prev, [invitationId]: false }));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-book-600 mx-auto mb-4"></div>
          <p>Loading invitations...</p>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Club Invitations</h2>
        <div className="space-y-4">
          {invitations.map(invitation => (
            invitation.club && (
              <div key={invitation.id} className="border rounded-md p-4">
                <h3 className="font-medium">{invitation.club.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {invitation.club.description}
                </p>
                {invitation.club.is_public === false && (
                  <p className="text-xs text-amber-600 mb-2">Private club</p>
                )}
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleAcceptInvitation(invitation)}
                    disabled={processingInvites[invitation.id]}
                    className="bg-book-600 hover:bg-book-700"
                    size="sm"
                  >
                    {processingInvites[invitation.id] ? 
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div> : 
                      "Accept"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeclineInvitation(invitation.id)}
                    disabled={processingInvites[invitation.id]}
                    size="sm"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubInvitationList;
