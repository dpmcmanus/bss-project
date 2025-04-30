
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useClubData } from "@/hooks/useClubData";
import { useClubJoin } from "@/hooks/useClubJoin";
import SearchBar from "@/components/explore/SearchBar";
import ClubList from "@/components/explore/ClubList";
import { useAuth } from "@/contexts/AuthContext";

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { isLoading, publicClubs, myClubIds, fetchClubs } = useClubData();
  const { joinClub } = useClubJoin(fetchClubs);
  const { isAuthenticated } = useAuth();

  // Filter clubs: those not already joined by user and matching search query
  const filteredClubs = publicClubs
    .filter(club => !myClubIds.has(club.id))
    .filter(club => 
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      club.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.memberCount - a.memberCount); // Default sort by most members

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Explore Book Clubs</h1>
        <p className="text-muted-foreground">Discover book clubs you can join</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>

      {!isAuthenticated && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
          <p>Sign in to join book clubs and access more features.</p>
        </div>
      )}

      <ClubList
        clubs={filteredClubs}
        isLoading={isLoading}
        onJoinClub={joinClub}
      />
    </div>
  );
};

export default Explore;
