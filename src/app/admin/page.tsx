
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
import { useFirestore, useCollection, useDoc } from "@/firebase";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, doc, writeBatch, getDocs, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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

export default function AdminDashboardPage() {
  const { dict } = useDictionary();
  const db = useFirestore();
  const { toast } = useToast();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { data: votes, isLoading: votesLoading } = useCollection<Vote>('votes');
  const { data: candidates, isLoading: candidatesLoading } = useCollection<Candidate>('candidates');
  const { data: electionSettings, isLoading: settingsLoading } = useDoc<ElectionSettings>('settings/election');
  
  const electionStatus = electionSettings?.status || "active";

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
  
  const isLoading = votesLoading || candidatesLoading || settingsLoading;

  const handleEndElection = async () => {
    if (!db) return;
    setIsUpdatingStatus(true);
    const settingsRef = doc(db, 'settings', 'election');
    try {
        await setDoc(settingsRef, { status: 'ended' });
        toast({ title: dict.appName, description: dict.admin.dashboard.endElectionSuccess });
    } catch (error) {
        console.error("Error ending election:", error);
        toast({ variant: 'destructive', title: dict.admin.auth.errorTitle, description: dict.admin.dashboard.endElectionError });
    } finally {
        setIsUpdatingStatus(false);
    }
  }

  const handleResetElection = async () => {
    if(!db) return;
    setIsUpdatingStatus(true);
    
    try {
        const batch = writeBatch(db);

        // Delete all votes
        const votesQuerySnapshot = await getDocs(collection(db, 'votes'));
        votesQuerySnapshot.forEach(doc => batch.delete(doc.ref));

        // Delete all candidates
        const candidatesQuerySnapshot = await getDocs(collection(db, 'candidates'));
        candidatesQuerySnapshot.forEach(doc => batch.delete(doc.ref));
        
        // Delete all groups
        const groupsQuerySnapshot = await getDocs(collection(db, 'groups'));
        groupsQuerySnapshot.forEach(doc => batch.delete(doc.ref));

        // Reset election status
        const settingsRef = doc(db, 'settings', 'election');
        batch.set(settingsRef, { status: 'active' });

        await batch.commit();

        toast({ title: dict.appName, description: dict.admin.dashboard.resetElectionSuccess });

    } catch (error) {
        console.error("Error resetting election:", error);
        toast({ variant: 'destructive', title: dict.admin.auth.errorTitle, description: dict.admin.dashboard.resetElectionError });
    } finally {
        setIsUpdatingStatus(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{dict.admin.dashboard.title}</CardTitle>
          <CardDescription>{dict.admin.dashboard.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{dict.admin.dashboard.totalVotes}</CardTitle>
              </CardHeader>
              <CardContent>
                 {isLoading ? <Skeleton className="h-10 w-1/2" /> : <p className="text-4xl font-bold">{totalVotes.toLocaleString()}</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{dict.admin.dashboard.electionStatus}</CardTitle>
              </CardHeader>
              <CardContent>
                 {isLoading ? <Skeleton className="h-10 w-1/2" /> :
                    <p className={`text-4xl font-bold ${electionStatus === 'active' ? 'text-green-600' : 'text-destructive'}`}>
                        {electionStatus === 'active' ? dict.admin.dashboard.statusActive : dict.admin.dashboard.statusEnded}
                    </p>
                 }
              </CardContent>
            </Card>
             <Card>
              <CardHeader>
                <CardTitle>{dict.admin.dashboard.controlsTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-10 w-full" /> : (
                    electionStatus === 'active' ? (
                        <Button onClick={handleEndElection} disabled={isUpdatingStatus} variant="destructive">
                           {isUpdatingStatus && <Loader2 className="animate-spin" />} 
                           {isUpdatingStatus ? dict.admin.dashboard.endingButton : dict.admin.dashboard.endElectionButton}
                        </Button>
                    ) : (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button disabled={isUpdatingStatus} variant="secondary">
                                    {isUpdatingStatus && <Loader2 className="animate-spin" />} 
                                    {isUpdatingStatus ? dict.admin.dashboard.resettingButton : dict.admin.dashboard.resetElectionButton}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>{dict.admin.dashboard.resetConfirmTitle}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {dict.admin.dashboard.resetConfirmDescription}
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>{dict.admin.dashboard.cancelButton}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetElection}>{dict.admin.dashboard.continueButton}</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>{dict.admin.dashboard.resultsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            { isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="w-full h-[350px]" />
              </div>
            ) :
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
              <Bar dataKey="votes" fill="hsl(var(--primary))" name={dict.admin.dashboard.votesLabel} />
            </BarChart>
            }
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
