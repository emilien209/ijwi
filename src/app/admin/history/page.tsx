
"use client"

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, History as HistoryIcon } from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";

// Mock data for demonstration. In a real app, this would come from a database.
const electionHistory = [
    { id: 1, name: "Presidential Election 2024", date: "2024-11-05", totalVotes: 125890, winner: "Candidate A" },
    { id: 2, name: "Parliamentary Election 2022", date: "2022-05-20", totalVotes: 890543, winner: "Party X" },
    { id: 3, name: "Local Council Election 2021", date: "2021-08-15", totalVotes: 34567, winner: "Candidate C" },
];

export default function ElectionHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { dict } = useDictionary();

  const filteredHistory = electionHistory.filter(election => 
    election.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    election.date.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{dict.admin.history.title}</CardTitle>
          <CardDescription>
            {dict.admin.history.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder={dict.admin.history.searchPlaceholder}
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            {filteredHistory.length > 0 ? (
              filteredHistory.map(election => (
                <Card key={election.id}>
                    <CardHeader>
                        <CardTitle>{election.name}</CardTitle>
                        <CardDescription>{dict.admin.history.concludedOn.replace('{date}', election.date)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-muted-foreground">{dict.admin.history.totalVotes}</p>
                                <p className="text-lg font-bold">{election.totalVotes.toLocaleString()}</p>
                            </div>
                             <div>
                                <p className="text-sm text-muted-foreground">{dict.admin.history.winner}</p>
                                <p className="text-lg font-bold text-primary">{election.winner}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
              ))
            ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <HistoryIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">
                    {dict.admin.history.noHistory}
                  </p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
