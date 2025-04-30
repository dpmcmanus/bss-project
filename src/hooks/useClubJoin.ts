
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const useClubJoin = (onSuccess?: () => void) => {
  const [joiningClubId, setJoiningClubId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const joinClub = async (clubId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to join book clubs",
        variant: "destructive"
      });
      return;
    }

    try {
      setJoiningClubId(clubId);
      
      // First check if the user is already a member of the club
      const { data: existingMembership, error: membershipError } = await supabase
        .from('club_members')
        .select()
        .eq('club_id', clubId)
        .eq('profile_id', user.id)
        .maybeSingle();
      
      if (membershipError) {
        console.error('Error checking membership:', membershipError);
        throw membershipError;
      }
      
      // If the user is already a member, just show success and don't try to insert
      if (existingMembership) {
        toast({
          title: "Already a member",
          description: "You're already a member of this club!"
        });
        
        if (onSuccess) {
          onSuccess();
        }
        return;
      }
      
      // Use upsert with onConflict and ignoreDuplicates to handle potential race conditions
      const { error } = await supabase
        .from('club_members')
        .upsert({
          club_id: clubId,
          profile_id: user.id,
          is_admin: false
        }, { 
          onConflict: 'club_id,profile_id',
          ignoreDuplicates: true
        });

      if (error) {
        console.error('Error joining club:', error);
        toast({
          title: "Error",
          description: "Failed to join the club. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "You've successfully joined the club!"
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error joining club:', error);
      toast({
        title: "Error",
        description: "Failed to join the club. Please try again.",
        variant: "destructive"
      });
    } finally {
      setJoiningClubId(null);
    }
  };

  return {
    joinClub,
    joiningClubId
  };
};
