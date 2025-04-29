
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
        
        // Check if user is a member of the club (using the is_club_member function)
        const { data: isMember, error: memberError } = await supabase
          .rpc('is_club_member', { club_uuid: params.clubId });
        
        if (memberError) {
          console.error("Error checking club membership:", memberError);
          throw memberError;
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
          .single();
        
        if (clubError) {
          console.error("Error checking if club is public:", clubError);
          throw clubError;
        }
        
        console.log("Club data:", clubData);
        
        if (clubData.is_public) {
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
            throw invitedError;
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
    }
  }, [isAuthenticated, isLoading, location.pathname, params.clubId, user]);

  // Show loading state while checking auth or access
  if (isLoading || (isAuthenticated && checkingAccess)) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
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
