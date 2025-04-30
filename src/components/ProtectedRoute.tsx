
import { useState, useEffect } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const params = useParams();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(false);

  useEffect(() => {
    const checkClubAccess = async () => {
      // Only check access for club routes with a club ID
      if (!location.pathname.includes('/clubs/') || !params.clubId || !user) {
        setHasAccess(true); // Default access for non-club routes
        return;
      }
      
      try {
        setCheckingAccess(true);
        console.log("Checking access for club:", params.clubId, "User:", user.id);
        
        // Use the RPC function to check membership instead of direct query
        // This will ensure consistent behavior with backend functions
        const { data: isMember, error: memberError } = await supabase
          .rpc('is_club_member', { club_uuid: params.clubId });
        
        if (memberError) {
          console.error("Error checking club membership:", memberError);
          setHasAccess(false);
          return;
        }
        
        console.log("Is member result:", isMember);
        
        if (isMember) {
          console.log("User is a club member, allowing access");
          setHasAccess(true);
          return;
        }
        
        // Check if the club is public
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('is_public')
          .eq('id', params.clubId)
          .maybeSingle();
        
        if (clubError && clubError.code !== 'PGRST116') {
          console.error("Error checking if club is public:", clubError);
          setHasAccess(false);
          return;
        }
        
        if (clubData?.is_public) {
          console.log("Club is public, allowing access");
          setHasAccess(true);
          return;
        }
        
        // Check if user has an invitation
        if (user.email) {
          console.log("Checking for invitations for email:", user.email);
          
          const { data: isInvited, error: invitedError } = await supabase
            .rpc('is_invited_to_club', { 
              club_uuid: params.clubId, 
              email_address: user.email 
            });
            
          if (invitedError) {
            console.error("Error checking club invitation:", invitedError);
            setHasAccess(false);
            return;
          }
          
          console.log("Is invited result:", isInvited);
          
          if (isInvited) {
            console.log("User has an invitation, allowing access");
            setHasAccess(true);
            return;
          }
        }
        
        // No access if not public, not a member, and no invitation
        console.log("User has no access to this private club");
        setHasAccess(false);
      } catch (error) {
        console.error("Error checking club access:", error);
        setHasAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };
    
    if (isAuthenticated && !isLoading) {
      checkClubAccess();
    } else if (!isAuthenticated && !isLoading) {
      setHasAccess(false);
    }
  }, [isAuthenticated, isLoading, location.pathname, params.clubId, user]);

  // Show loading state while checking auth or access
  if (isLoading || (isAuthenticated && checkingAccess)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-book-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Redirect to dashboard if no access to the club
  if (hasAccess === false) {
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated and has access, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
