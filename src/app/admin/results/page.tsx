
"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDictionary } from "@/hooks/use-dictionary";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useCollection } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF8C00"];


interface Vote {
    candidateId: string;
    candidateName: string;
}

interface Candidate {
    id: string;
    name: string;
}

export default function ElectionResultsPage() {
  const { dict } = useDictionary();
  const { data: votes, isLoading: votesLoading } = useCollection<Vote>('votes');
  const { data: candidates, isLoading: candidatesLoading } = useCollection<Candidate>('candidates');
  
  const electionStatus = "active"; // "active" or "ended"

  const electionData = useMemo(() => {
    if (!votes || !candidates) return [];

    const voteCounts = new Map<string, number>();
    candidates.forEach(c => voteCounts.set(c.name, 0)); // Initialize all candidates with 0 votes

    votes.forEach(vote => {
        if(vote.candidateName) {
            voteCounts.set(vote.candidateName, (voteCounts.get(vote.candidateName) || 0) + 1);
        }
    });

    const data = Array.from(voteCounts.entries()).map(([name, count]) => ({
        name,
        votes: count,
    }));
    
    // Only return candidates who have votes or if there are no votes at all.
    if(votes.length > 0) {
        return data.filter(d => d.votes > 0);
    }
    return data;

  }, [votes, candidates]);
  
  const isLoading = votesLoading || candidatesLoading;


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{dict.navResults}</CardTitle>
           <CardDescription>
            {electionStatus === "ended"
              ? "The election has concluded. Here are the final results."
              : "The election is ongoing. Results are updated in real-time."}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[500px]">
          { isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="w-full h-[450px]" />
            </div>
           ) : electionData && electionData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={electionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
                outerRadius={150}
                fill="#8884d8"
                dataKey="votes"
                nameKey="name"
              >
                {electionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                 contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No voting data available yet.</p>
                </div>
            )
          }
        </CardContent>
      </Card>
    </div>
  );
}
