
import { useEffect, useState } from "react";
import { useParams, Outlet, NavLink, useNavigate } from "react-router-dom";
import { BookOpen, User, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type ClubType = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  currentBook?: {
    id: string;
    title: string;
    author: string;
    progress?: number;
    goal?: {
      chapter: number;
      date: string;
    }
  }
};

const ClubDetail = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [club, setClub] = useState<ClubType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (clubId && user) {
      fetchClubDetails();
    }
  }, [clubId, user]);
  
  const fetchClubDetails = async () => {
    try {
      setIsLoading(true);
      
      // Fetch club details
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();
        
      if (clubError) throw clubError;
      
      // Get member count
      const { count: memberCount } = await supabase
        .from('club_members')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId);
      
      // Get current book
      const { data: bookData } = await supabase
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
        .eq('club_id', clubId)
        .eq('is_current_book', true)
        .single();
      
      // Create club object
      const clubWithDetails: ClubType = {
        id: clubData.id,
        name: clubData.name,
        description: clubData.description,
        memberCount: memberCount || 0,
        currentBook: bookData ? {
          id: bookData.book.id,
          title: bookData.book.title,
          author: bookData.book.author,
          goal: bookData.goal_chapter ? {
            chapter: bookData.goal_chapter,
            date: new Date(bookData.goal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          } : undefined
        } : undefined
      };
      
      setClub(clubWithDetails);
    } catch (error) {
      console.error("Error fetching club details:", error);
      navigate("/404");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <ClubSkeleton />;
  }
  
  if (!club) {
    return <div className="text-center p-8">Club not found</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="rounded-lg overflow-hidden bg-gradient-to-r from-book-900 to-book-700 text-white p-8 mb-6">
        <h1 className="text-3xl font-bold">{club.name}</h1>
      </div>
      
      <div className="mb-6 overflow-x-auto">
        <div className="flex min-w-max border-b">
          <NavLink
            to={`/clubs/${clubId}`}
            end
            className={({ isActive }) =>
              `club-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <User className="h-4 w-4" />
            <span>Overview</span>
          </NavLink>
          
          <NavLink
            to={`/clubs/${clubId}/reading-list`}
            className={({ isActive }) =>
              `club-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <BookOpen className="h-4 w-4" />
            <span>Reading List</span>
          </NavLink>
          
          <NavLink
            to={`/clubs/${clubId}/reviews`}
            className={({ isActive }) =>
              `club-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Star className="h-4 w-4" />
            <span>Reviews</span>
          </NavLink>
        </div>
      </div>
      
      <Outlet context={{ club }} />
    </div>
  );
};

const ClubSkeleton = () => (
  <div>
    <Skeleton className="h-32 w-full rounded-lg mb-6" />
    <div className="flex gap-2 mb-6">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
);

export default ClubDetail;
