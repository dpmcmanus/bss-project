import { useState } from "react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search } from "lucide-react";
import ClubCard from "@/components/ClubCard";

// Mock data for Dashboard clubs (to filter them out)
const dashboardClubs = [
  {
    id: "1",
    name: "Science Fiction Lovers"
  },
  {
    id: "2",
    name: "Mystery & Thriller Club"
  }
];

// Mock data for public clubs
const mockPublicClubs = [
  {
    id: "3",
    name: "Classic Literature",
    description: "Dive into the timeless classics that have shaped literary history.",
    memberCount: 3,
    isPublic: true,
    currentBook: {
      title: "Pride and Prejudice",
      author: "Jane Austen",
      progress: 75,
      goal: {
        chapter: 15,
        date: "May 9"
      }
    }
  },
  {
    id: "4",
    name: "Science Fiction & Fantasy",
    description: "For lovers of both science fiction and fantasy genres.",
    memberCount: 3,
    isPublic: false,
    currentBook: {
      title: "The Fifth Season",
      author: "N.K. Jemisin",
      progress: 30,
      goal: {
        chapter: 7,
        date: "May 19"
      }
    }
  },
  {
    id: "5",
    name: "Historical Fiction Fans",
    description: "Exploring the past through the lens of fiction.",
    memberCount: 2,
    isPublic: true,
    currentBook: {
      title: "The Lincoln Highway",
      author: "Amor Towles",
      progress: 60,
      goal: {
        chapter: 5,
        date: "May 11"
      }
    }
  }
];

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("most-members");

  // Filter clubs: exclude dashboard clubs, only show public clubs, and apply search/sort
  const filteredClubs = mockPublicClubs
    .filter(club => !dashboardClubs.some(dashClub => dashClub.id === club.id))
    .filter(club => club.isPublic) // Only show public clubs
    .filter(club => 
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      club.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === "most-members") {
        return b.memberCount - a.memberCount;
      } else if (sortOption === "alphabetical") {
        return a.name.localeCompare(b.name);
      } else {
        return 0;
      }
    });

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Explore Book Clubs</h1>
        <p className="text-muted-foreground">Discover public book clubs you can join</p>
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClubs.map((club) => (
          <ClubCard key={club.id} {...club} showJoin={true} />
        ))}
      </div>

      {filteredClubs.length === 0 && (
        <div className="text-center py-12">
          <h3 className="font-medium">No clubs found</h3>
          <p className="text-muted-foreground">Try adjusting your search query</p>
        </div>
      )}
    </div>
  );
};

export default Explore;
