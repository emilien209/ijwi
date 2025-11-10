
"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";

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
  
  const totalVotes = useMemo(() => votes?.length || 0, [votes]);

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
        percentage: totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(2) : "0.00",
    })).sort((a, b) => b.votes - a.votes);
    
    // Only return candidates who have votes or if there are no votes at all.
    if(votes.length > 0) {
        return data.filter(d => d.votes > 0);
    }
    return data;

  }, [votes, candidates, totalVotes]);
  
  const isLoading = votesLoading || candidatesLoading || settingsLoading;


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{dict.navResults}</CardTitle>
           <CardDescription>
            {electionStatus === "ended"
              ? dict.results.description
              : dict.results.ongoingDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          { isLoading ? (
            <div className="flex items-center justify-center h-[500px]">
              <Skeleton className="w-full h-[450px]" />
            </div>
           ) : electionData && electionData.length > 0 ? (
            <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="h-[400px]">
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
                </div>
                 <div>
                    <div className="mb-4 text-center">
                        <p className="text-muted-foreground">{dict.results.totalVotes}</p>
                        <p className="text-3xl font-bold">{totalVotes.toLocaleString()}</p>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>{dict.admin.candidates.nameLabel}</TableHead>
                            <TableHead className="text-right">{dict.admin.dashboard.votesLabel}</TableHead>
                            <TableHead className="text-right">Ijanisha</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {electionData.map((candidate) => (
                            <TableRow key={candidate.name}>
                                <TableCell className="font-medium">{candidate.name}</TableCell>
                                <TableCell className="text-right">{candidate.votes.toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="secondary">{candidate.percentage}%</Badge>
                                </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
            ) : (
                <div className="flex items-center justify-center h-[500px]">
                    <p className="text-muted-foreground">{dict.results.noData}</p>
                </div>
            )
          }
        </CardContent>
      </Card>
    </div>
  );
}
