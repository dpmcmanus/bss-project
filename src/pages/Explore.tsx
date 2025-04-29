
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import ClubCard from "@/components/ClubCard";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("most-members");
  const [isLoading, setIsLoading] = useState(true);
  const [publicClubs, setPublicClubs] = useState([]);
  const [myClubIds, setMyClubIds] = useState(new Set());
  const { user } = useAuth();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

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

      // Modified query to get accurate member counts
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs')
        .select(`
          id,
          name,
          description,
          is_public,
          club_books (
            books (
              title,
              author
            ),
            goal_chapter,
            goal_date,
            is_current_book
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
      
      const transformedClubs = clubsData.map((club, index) => {
        const currentBookData = club.club_books?.find(book => book.is_current_book);
        
        return {
          id: club.id,
          name: club.name,
          description: club.description,
          isPublic: club.is_public,
          memberCount: memberCountResults[index].count || 0,
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchClubs();
  };

  const handleJoinClub = async (clubId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to join book clubs",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('club_members')
        .insert({
          club_id: clubId,
          profile_id: user.id
        });

      if (error) throw error;

      setMyClubIds(prev => new Set([...prev, clubId]));
      
      toast({
        title: "Success",
        description: "You've successfully joined the club!"
      });
    } catch (error) {
      console.error('Error joining club:', error);
      toast({
        title: "Error",
        description: "Failed to join the club. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredClubs = publicClubs
    .filter(club => !myClubIds.has(club.id))
    .filter(club => 
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      club.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === "most-members") {
        return b.memberCount - a.memberCount;
      } else if (sortOption === "alphabetical") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Explore Book Clubs</h1>
        <p className="text-muted-foreground">Discover book clubs you can join</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clubs..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={sortOption} onValueChange={setSortOption}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="most-members">Most Members</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleRefresh} 
          disabled={isLoading || refreshing}
          className="h-10 w-10 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-book-600 mx-auto mb-4"></div>
            <p>Loading clubs...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map((club) => (
              <ClubCard 
                key={club.id} 
                {...club} 
                showJoin={true}
                onJoin={() => handleJoinClub(club.id)}
                showViewButton={false}
              />
            ))}
          </div>

          {filteredClubs.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <h3 className="font-medium">No clubs found</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "Try adjusting your search query"
                  : "No public clubs available to join at the moment"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Explore;
