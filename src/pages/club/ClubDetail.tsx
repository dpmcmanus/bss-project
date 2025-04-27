
import { useEffect } from "react";
import { useParams, Outlet, NavLink, useNavigate } from "react-router-dom";
import { BookOpen, User, MessageSquare, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data
const mockClubs = [
  {
    id: "1",
    name: "Science Fiction Lovers",
    description: "A club dedicated to exploring the vast worlds of science fiction literature, from classic to contemporary works that push the boundaries of imagination.",
    memberCount: 4,
    currentBook: {
      id: "101",
      title: "Dune",
      author: "Frank Herbert",
      progress: 45,
      goal: {
        chapter: 10,
        date: "May 14"
      }
    }
  },
  {
    id: "2",
    name: "Mystery & Thriller Club",
    description: "For those who enjoy page-turning suspense and clever mysteries.",
    memberCount: 3,
    currentBook: {
      id: "102",
      title: "The Silent Patient",
      author: "Alex Michaelides",
      progress: 65,
      goal: {
        chapter: 2,
        date: "May 17"
      }
    }
  }
];

const ClubDetail = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  
  // Find the club from mock data
  const club = mockClubs.find(c => c.id === clubId);
  
  // Redirect to 404 if club not found
  useEffect(() => {
    if (!club) {
      navigate("/404");
    }
  }, [club, navigate]);
  
  if (!club) {
    return <ClubSkeleton />;
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
            to={`/clubs/${clubId}/suggestions`}
            className={({ isActive }) =>
              `club-nav-link ${isActive ? 'active' : ''}`
            }
          >
            <MessageSquare className="h-4 w-4" />
            <span>Suggestions</span>
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
      <Skeleton className="h-10 w-24" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
);

export default ClubDetail;
