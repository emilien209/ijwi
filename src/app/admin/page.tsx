
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDictionary } from "@/hooks/use-dictionary";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useCollection } from "@/firebase";
import { useMemo } from "react";

interface Vote {
    candidateId: string;
    candidateName: string;
}

interface Candidate {
    id: string;
    name: string;
}

export default function AdminDashboardPage() {
  const { dict } = useDictionary();
  const { data: votes, isLoading: votesLoading } = useCollection<Vote>('votes');
  const { data: candidates, isLoading: candidatesLoading } = useCollection<Candidate>('candidates');
  
  const electionStatus = "active"; // "active" or "ended"

  const electionData = useMemo(() => {
    if (!votes || !candidates) return [];

    const voteCounts = new Map<string, number>();
    votes.forEach(vote => {
        voteCounts.set(vote.candidateId, (voteCounts.get(vote.candidateId) || 0) + 1);
    });

    return candidates.map(candidate => ({
        name: candidate.name,
        votes: voteCounts.get(candidate.id) || 0,
    }));
  }, [votes, candidates]);

  const totalVotes = useMemo(() => electionData.reduce((acc, curr) => acc + curr.votes, 0), [electionData]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{dict.admin.dashboardTitle}</CardTitle>
          <CardDescription>{dict.admin.dashboardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{dict.admin.totalVotes}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{votesLoading ? '...' : totalVotes.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{dict.admin.electionStatus}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-4xl font-bold ${electionStatus === 'active' ? 'text-green-600' : 'text-destructive'}`}>
                    {electionStatus === 'active' ? dict.admin.statusActive : dict.admin.statusEnded}
                </p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle>{dict.admin.manageCandidates}</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/admin/candidates">
                    <Button>{dict.admin.goToCandidates}</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>{dict.admin.resultsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            { (votesLoading || candidatesLoading) ? <div>Loading...</div> :
            <BarChart
              data={electionData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                }}
              />
              <Legend />
              <Bar dataKey="votes" fill="hsl(var(--primary))" name={dict.admin.votesLabel} />
            </BarChart>
            }
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
