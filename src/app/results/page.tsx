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
import { useCollection, useDoc } from "@/firebase";
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

interface ElectionSettings {
    status: 'active' | 'ended';
}

export default function ElectionResultsPage() {
  const { dict } = useDictionary();
  const { data: votes, isLoading: votesLoading } = useCollection<Vote>('votes');
  const { data: candidates, isLoading: candidatesLoading } = useCollection<Candidate>('candidates');
  const { data: electionSettings, isLoading: settingsLoading } = useDoc<ElectionSettings>('settings/election');
  
  const electionStatus = electionSettings?.status || "active";

  const electionData = useMemo(() => {
    if (!votes || !candidates) return [];

    const voteCounts = new Map<string, number>();
    candidates.forEach(c => voteCounts.set(c.name, 0)); 

    votes.forEach(vote => {
        if(vote.candidateName) {
            voteCounts.set(vote.candidateName, (voteCounts.get(vote.candidateName) || 0) + 1);
        }
    });

    const data = Array.from(voteCounts.entries()).map(([name, count]) => ({
        name,
        votes: count,
    }));
    
    if(votes.length > 0) {
        return data.filter(d => d.votes > 0);
    }
    return data;

  }, [votes, candidates]);

  const isLoading = votesLoading || candidatesLoading || settingsLoading;

  if (isLoading) {
      return (
        <div className="container mx-auto py-8 px-4">
             <Card className="w-full max-w-4xl mx-auto shadow-2xl bg-card/80">
                <CardHeader>
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent className="h-[500px] flex items-center justify-center">
                    <Skeleton className="w-full h-[450px]" />
                </CardContent>
            </Card>
        </div>
      )
  }

  if (electionStatus === 'active') {
      return (
        <div className="container mx-auto py-8 px-4">
             <Card className="w-full max-w-4xl mx-auto shadow-2xl text-center bg-card/80">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold font-headline text-primary">
                        {dict.results.unavailableTitle}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription className="text-lg">
                        {dict.results.unavailableDescription}
                    </CardDescription>
                </CardContent>
             </Card>
        </div>
      )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto shadow-2xl bg-card/80">
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline text-primary">{dict.results.title}</CardTitle>
           <CardDescription className="text-lg">
            {dict.results.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[500px]">
          {electionData && electionData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={electionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
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
                    <p className="text-muted-foreground">{dict.results.noData}</p>
                </div>
            )
          }
        </CardContent>
      </Card>
    </div>
  );
}
