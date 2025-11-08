
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

interface Vote {
    candidateName: string;
}

export default function ElectionResultsPage() {
  const { dict } = useDictionary();
  const { data: votes, isLoading: votesLoading } = useCollection<Vote>('votes');

  const electionData = useMemo(() => {
    if (!votes) return [];

    const voteCounts = new Map<string, number>();
    votes.forEach(vote => {
        const name = vote.candidateName || "Abstain";
        voteCounts.set(name, (voteCounts.get(name) || 0) + 1);
    });

    return Array.from(voteCounts.entries()).map(([name, count]) => ({
        name,
        votes: count,
    }));
  }, [votes]);

  const electionStatus = "ended"; // "active" or "ended"

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
          { votesLoading ? (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="w-full h-[450px]" />
            </div>
           ) :
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
          }
        </CardContent>
      </Card>
    </div>
  );
}
