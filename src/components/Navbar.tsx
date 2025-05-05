
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Book, Home, LogOut, Menu, Search, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Extract initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-border">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center mr-6">
              <Book className="h-6 w-6 text-book-600 mr-2" />
              <span className="font-bold text-lg">Book Club</span>
            </Link>
            
            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-book-100 hover:text-book-600 transition-colors"
              >
                <span className="flex items-center">
                  <Home className="h-4 w-4 mr-1" />
                  Dashboard
                </span>
              </Link>
              <Link 
                to="/explore" 
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-book-100 hover:text-book-600 transition-colors"
              >
                <span className="flex items-center">
                  <Search className="h-4 w-4 mr-1" />
                  Explore
                </span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center">
            {/* Mobile menu button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden mr-2">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <div className="flex flex-col space-y-4 py-4">
                  <Link 
                    to="/dashboard" 
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-book-100 hover:text-book-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link 
                    to="/explore" 
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-book-100 hover:text-book-600 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Explore
                  </Link>
                </div>
              </SheetContent>
            </Sheet>

            {user && (
              <div className="flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-book-100 text-book-800">
                          {profile?.name ? getInitials(profile.name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none">{profile?.name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      signOut();
                      navigate('/signin');
                    }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
