
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
import { placeholderImages } from "@/lib/placeholder-images.json";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

const electionData = [
  { name: "Candidate A", votes: 456, imageId: "candidate-a" },
  { name: "Candidate B", votes: 812, imageId: "candidate-b" },
  { name: "Candidate C", votes: 623, imageId: "candidate-c" },
];

const electionStatus = "active"; // "active" or "ended"

export default function AdminDashboardPage() {
  const { dict } = useDictionary();
  const totalVotes = electionData.reduce((acc, curr) => acc + curr.votes, 0);

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
                <p className="text-4xl font-bold">{totalVotes.toLocaleString()}</p>
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
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

