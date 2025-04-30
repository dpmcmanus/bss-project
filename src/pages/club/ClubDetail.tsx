
import { useEffect, useState } from "react";
import { useParams, Outlet, NavLink, useNavigate } from "react-router-dom";
import { BookOpen, User, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ClubType = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isPublic?: boolean;
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
  const { clubId } = useParams<{clubId: string}>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [club, setClub] = useState<ClubType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!clubId) {
      navigate('/dashboard');
      return;
    }
    
    if (user) {
      // First check if the user is a member to avoid unnecessary redirects
      checkMembership().then(membershipResult => {
        if (membershipResult) {
          fetchClubDetails();
        }
      });
    }
  }, [clubId, user]);
  
  const fetchClubDetails = async () => {
    try {
      console.log("Fetching club details for club ID:", clubId);
      setIsLoading(true);
      
      // Fetch club details
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single();
        
      if (clubError) {
        console.error("Error fetching club details:", clubError);
        toast({
          title: "Error",
          description: "Failed to load club details. Please try again.",
          variant: "destructive"
        });
        navigate("/dashboard");
        return;
      }
      
      console.log("Club data retrieved:", clubData);
      
      // Save if club is public
      setIsPublic(clubData.is_public);
      
      // Get member count
      const { count: memberCount } = await supabase
        .from('club_members')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', clubId);
      
      // Get current book
      const { data: bookData } = await supabase
        .from('club_books')
        .select(`
          id,
          goal_chapter,
          goal_date,
          book:books (
            id,
            title,
            author
          )
        `)
        .eq('club_id', clubId)
        .eq('is_current', true)
        .maybeSingle();
      
      // Create club object
      const clubWithDetails: ClubType = {
        id: clubData.id,
        name: clubData.name,
        description: clubData.description,
        isPublic: clubData.is_public,
        memberCount: memberCount || 0,
        currentBook: bookData ? {
          id: bookData.book.id,
          title: bookData.book.title,
          author: bookData.book.author,
          goal: bookData.goal_chapter ? {
            chapter: bookData.goal_chapter,
            date: bookData.goal_date ? new Date(bookData.goal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : undefined
          } : undefined
        } : undefined
      };
      
      console.log("Club with details:", clubWithDetails);
      setClub(clubWithDetails);
    } catch (error) {
      console.error("Error in fetchClubDetails:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const checkMembership = async () => {
    if (!user || !clubId) return false;
    
    try {
      console.log("Checking membership for club:", clubId, "User:", user.id);
      
      const { data, error } = await supabase
        .rpc('is_club_member', { club_uuid: clubId });
        
      if (error) {
        console.error("Error checking membership:", error);
        return false;
      }
      
      console.log("Is member result:", data);
      setIsMember(!!data);
      
      // If user is a member, they have access
      if (data) {
        console.log("User is a club member, allowing access");
        return true;
      }
      
      // If not a member, check if club is public
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('is_public')
        .eq('id', clubId)
        .single();
        
      if (clubError) {
        console.error("Error checking if club is public:", clubError);
        return false;
      }
      
      console.log("Club data:", clubData);
      setIsPublic(clubData.is_public);
      
      if (clubData.is_public) {
        console.log("Club is public, allowing access");
        return true;
      }
      
      // If user has email, check for invitations
      if (user.email) {
        console.log("Checking for invitations for email:", user.email);
        
        const { data: isInvited, error: invitedError } = await supabase
          .rpc('is_invited_to_club', { 
            club_uuid: clubId, 
            email_address: user.email 
          });
          
        if (invitedError) {
          console.error("Error checking club invitation:", invitedError);
          return false;
        }
        
        console.log("Is invited result:", isInvited);
        
        if (isInvited) {
          console.log("User has an invitation, allowing access");
          return true;
        }
      }
      
      // No access if not public, not a member, and no invitation
      console.log("User has no access to this private club");
      navigate("/dashboard");
      return false;
    } catch (error) {
      console.error("Error in checkMembership:", error);
      navigate("/dashboard");
      return false;
    }
  };
  
  const handleJoinClub = async () => {
    if (!user || !clubId) return;
    
    try {
      const { error } = await supabase
        .from('club_members')
        .insert({
          club_id: clubId,
          profile_id: user.id
        });
        
      if (error) {
        console.error("Error joining club:", error);
        toast({
          title: "Error",
          description: "Failed to join the club. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      setIsMember(true);
      toast({
        title: "Success",
        description: "You have successfully joined the club.",
      });
    } catch (error) {
      console.error("Error joining club:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
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
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <h1 className="text-3xl font-bold mb-2 md:mb-0">{club.name}</h1>
          {!isMember && (
            <button 
              onClick={handleJoinClub} 
              className="py-2 px-4 bg-white text-book-900 rounded-md hover:bg-opacity-90 transition-colors mt-2 md:mt-0"
            >
              Join Club
            </button>
          )}
        </div>
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
          
          {isMember && (
            <>
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
            </>
          )}
        </div>
      </div>
      
      <Outlet context={{ club, isMember }} />
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
