
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const ClubSuggestions = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold mb-4">Book Club Suggestions</h2>
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            The suggestions feature has been removed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubSuggestions;
