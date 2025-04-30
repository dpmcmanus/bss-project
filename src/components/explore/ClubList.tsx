
import ClubCard from "@/components/ClubCard";
import { ClubListItem } from "@/types/clubs";

type ClubListProps = {
  clubs: ClubListItem[];
  isLoading: boolean;
  onJoinClub: (clubId: string) => Promise<void>;
};

const ClubList = ({ clubs, isLoading, onJoinClub }: ClubListProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-book-600 mx-auto mb-4"></div>
          <p>Loading clubs...</p>
        </div>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="font-medium">No clubs found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search query or check back later
        </p>
      </div>
    );
  }

  // Debug to verify clubs data being passed to cards
  console.log('Clubs being rendered:', clubs.map(club => ({ name: club.name, memberCount: club.memberCount })));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {clubs.map((club) => (
        <ClubCard 
          key={club.id} 
          {...club} 
          showJoin={true}
          onJoin={() => onJoinClub(club.id)}
          showViewButton={false}
          showMemberCount={false}
        />
      ))}
    </div>
  );
};

export default ClubList;
