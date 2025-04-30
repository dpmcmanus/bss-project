
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
      
      if (user) {
        const { data: memberData } = await supabase
          .from('club_members')
          .select('club_id')
          .eq('profile_id', user.id);
          
        if (memberData) {
          setMyClubIds(new Set(memberData.map(m => m.club_id)));
        }
      }

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
        `)
        .eq('is_public', true);

      if (clubsError) throw clubsError;

      // Get member counts separately for more accurate results
      const memberCountPromises = clubsData.map(club => 
        supabase
          .from('club_members')
          .select('id', { count: 'exact', head: true })
          .eq('club_id', club.id)
      );
      
      const memberCountResults = await Promise.all(memberCountPromises);
      
      // Add debugging to check the actual count values
      console.log('Member count results:', memberCountResults.map(res => res.count));
      
      const transformedClubs = clubsData.map((club, index) => {
        const currentBookData = club.club_books?.find(book => book.is_current);
        const memberCount = memberCountResults[index].count || 0;
        
        // Debug each club's member count
        console.log(`Club ${club.name} has ${memberCount} members`);
        
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
