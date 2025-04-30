
export type ClubListItem = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isPublic?: boolean;
  currentBook?: {
    title: string;
    author: string;
    goal?: {
      chapter: number;
      date: string;
    };
  };
};
