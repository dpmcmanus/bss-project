import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ClubCard from "@/components/ClubCard";
import { useToast } from "@/hooks/use-toast";

// Mock data for clubs
const mockClubs = [
  {
    id: "1",
    name: "Science Fiction Lovers",
    description: "A club dedicated to exploring the vast worlds of science fiction literature.",
    memberCount: 4,
    isPublic: true,
    currentBook: {
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
    isPublic: false,
    currentBook: {
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

const Dashboard = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClub, setNewClub] = useState({
    name: "",
    description: "",
    isPublic: true
  });
  const { toast } = useToast();

  const handleCreateClub = () => {
    toast({
      title: "Club created",
      description: `${newClub.name} has been created successfully.`,
    });
    
    setNewClub({
      name: "",
      description: "",
      isPublic: true
    });
    
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Book Clubs</h1>
          <p className="text-muted-foreground">Manage your book clubs and reading activities</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-book-600 hover:bg-book-700">
              <Plus className="h-4 w-4 mr-1" />
              Create New Club
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Book Club</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="club-name">Club Name</Label>
                <Input
                  id="club-name"
                  placeholder="e.g. Classic Literature"
                  value={newClub.name}
                  onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="club-description">Description</Label>
                <Textarea
                  id="club-description"
                  placeholder="What kind of books will your club read?"
                  value={newClub.description}
                  onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={newClub.isPublic}
                  onCheckedChange={(checked) => setNewClub({ ...newClub, isPublic: checked })}
                />
                <Label htmlFor="public">Make this club public</Label>
              </div>
              
              <Button 
                className="w-full bg-book-600 hover:bg-book-700"
                onClick={handleCreateClub}
                disabled={!newClub.name.trim() || !newClub.description.trim()}
              >
                Create Club
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-12">
        <h2 className="text-lg font-semibold mb-4">My Clubs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockClubs.map((club) => (
            <ClubCard key={club.id} {...club} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
