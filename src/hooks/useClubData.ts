
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ClubListItem } from "@/types/clubs";

export const useClubData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [publicClubs, setPublicClubs] = useState<ClubListItem[]>([]);
  const [myClubIds, setMyClubIds] = useState(new Set<string>());
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchClubs = async () => {
    try {
      setIsLoading(true);
      
      // First, get the clubs the current user is a member of
      if (user) {
        const { data: memberData, error: memberError } = await supabase
          .from('club_members')
          .select('club_id')
          .eq('profile_id', user.id);
          
        if (memberError) {
          console.error("Error fetching club memberships:", memberError);
          throw memberError;
        }
        
        if (memberData) {
          setMyClubIds(new Set(memberData.map(m => m.club_id)));
        }
      }

      // Get all clubs the user is allowed to see (based on RLS policies)
      // With RLS in place, this will automatically filter to only public clubs or ones the user can access
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs')
        .select(`
          id,
          name,
          description,
          is_public,
          club_books (
            id,
            book_id,
            is_current,
            goal_chapter,
            goal_date,
            books:book_id (
              title,
              author
            )
          )
        `);

      if (clubsError) {
        console.error("Error fetching clubs:", clubsError);
        throw clubsError;
      }

      if (!clubsData) {
        setPublicClubs([]);
        setIsLoading(false);
        return;
      }

      // Fetch member counts separately for each club
      const memberCountPromises = clubsData.map(club => 
        supabase
          .from('club_members')
          .select('id', { count: 'exact', head: true })
          .eq('club_id', club.id)
      );
      
      const memberCountResults = await Promise.all(memberCountPromises);
      
      // Transform the club data with member counts
      const transformedClubs = clubsData.map((club, index) => {
        const currentBookData = club.club_books?.find(book => book.is_current);
        const memberCount = memberCountResults[index].count || 0;
        
        return {
          id: club.id,
          name: club.name,
          description: club.description,
          isPublic: club.is_public,
          memberCount: memberCount,
          currentBook: currentBookData ? {
            title: currentBookData.books?.title,
            author: currentBookData.books?.author,
            goal: currentBookData.goal_chapter ? {
              chapter: currentBookData.goal_chapter,
              date: new Date(currentBookData.goal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            } : undefined
          } : undefined
        };
      });

      setPublicClubs(transformedClubs);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast({
        title: "Error",
        description: "Failed to load book clubs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, [user]);

  return {
    isLoading,
    publicClubs,
    myClubIds,
    fetchClubs
  };
};
