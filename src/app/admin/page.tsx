
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
import { useMemo, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, doc, writeBatch, getDocs, setDoc, updateDoc } from "firebase/firestore";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface Vote {
    candidateId: string;
    candidateName: string;
}

interface Candidate {
    id: string;
    name: string;
}

interface Group {
    id: string;
    name: string;
}

interface ElectionSettings {
    status: 'active' | 'ended';
    startDate?: string;
    endDate?: string;
    activeGroupId?: string;
}

export default function AdminDashboardPage() {
  const { dict } = useDictionary();
  const db = useFirestore();
  const { toast } = useToast();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();

  const { data: votes, isLoading: votesLoading } = useCollection<Vote>('votes');
  const { data: candidates, isLoading: candidatesLoading } = useCollection<Candidate>('candidates');
  const { data: groups, isLoading: groupsLoading } = useCollection<Group>('groups');
  const { data: electionSettings, isLoading: settingsLoading } = useDoc<ElectionSettings>('settings/election');
  
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  useEffect(() => {
    if (electionSettings) {
        if (electionSettings.startDate) {
            setStartDate(parseISO(electionSettings.startDate));
        }
        if (electionSettings.endDate) {
            setEndDate(parseISO(electionSettings.endDate));
        }
        if (electionSettings.activeGroupId) {
            setSelectedGroupId(electionSettings.activeGroupId);
        }
    }
  }, [electionSettings]);


  const electionStatus = useMemo(() => {
    if (!electionSettings) return "active";
    if (electionSettings.status === 'ended') return 'ended';

    const now = new Date();
    const start = electionSettings.startDate ? parseISO(electionSettings.startDate) : null;
    const end = electionSettings.endDate ? parseISO(electionSettings.endDate) : null;

    if (end && now > end) return 'ended';
    if (start && now < start) return 'pending';
    return 'active';
  }, [electionSettings]);

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
  
  const isLoading = votesLoading || candidatesLoading || settingsLoading || groupsLoading;
  
  const handleSetActiveGroup = async () => {
     if (!db || !selectedGroupId) {
        toast({ variant: 'destructive', title: dict.admin.auth.errorTitle, description: dict.admin.candidates.noGroupSelected});
        return;
    };
    setIsUpdatingStatus(true);
    const settingsRef = doc(db, 'settings', 'election');
    try {
        await updateDoc(settingsRef, { 
            activeGroupId: selectedGroupId,
        });
        toast({ title: dict.appName, description: "Active election group has been set." });
    } catch (error) {
        console.error("Error setting active group:", error);
        toast({ variant: 'destructive', title: dict.admin.auth.errorTitle, description: "Could not set the active election group." });
    } finally {
        setIsUpdatingStatus(false);
    }
  }


  const handleSetDates = async () => {
    if (!db || !startDate || !endDate) {
        toast({ variant: 'destructive', title: dict.admin.auth.errorTitle, description: "Please select both start and end dates."});
        return;
    };
    if (startDate > endDate) {
        toast({ variant: 'destructive', title: dict.admin.auth.errorTitle, description: "End date must be after start date."});
        return;
    }
    
    setIsUpdatingStatus(true);
    const settingsRef = doc(db, 'settings', 'election');
    try {
        await updateDoc(settingsRef, { 
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });
        toast({ title: dict.appName, description: dict.admin.dashboard.updateDatesSuccess });
    } catch (error) {
        console.error("Error setting dates:", error);
        toast({ variant: 'destructive', title: dict.admin.auth.errorTitle, description: dict.admin.dashboard.updateDatesError });
    } finally {
        setIsUpdatingStatus(false);
    }
  }


  const handleEndElection = async () => {
    if (!db) return;
    setIsUpdatingStatus(true);
    const settingsRef = doc(db, 'settings', 'election');
    try {
        await setDoc(settingsRef, { status: 'ended' }, { merge: true });
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


        // Reset election status and dates
        const settingsRef = doc(db, 'settings', 'election');
        batch.set(settingsRef, { 
            status: 'active',
            startDate: null,
            endDate: null,
            activeGroupId: null,
        });

        await batch.commit();

        setStartDate(undefined);
        setEndDate(undefined);
        setSelectedGroupId(undefined);
        toast({ title: dict.appName, description: dict.admin.dashboard.resetElectionSuccess });

    } catch (error) {
        console.error("Error resetting election:", error);
        toast({ variant: 'destructive', title: dict.admin.auth.errorTitle, description: dict.admin.dashboard.resetElectionError });
    } finally {
        setIsUpdatingStatus(false);
    }
  }

  const getStatusComponent = () => {
      switch (electionStatus) {
          case 'active':
            return <p className="text-4xl font-bold text-green-600">{dict.admin.dashboard.statusActive}</p>
          case 'ended':
            return <p className="text-4xl font-bold text-destructive">{dict.admin.dashboard.statusEnded}</p>
          case 'pending':
            return <p className="text-4xl font-bold text-yellow-500">{dict.admin.dashboard.statusPending}</p>
          default:
            return <Skeleton className="h-10 w-1/2" />
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                 {isLoading ? <Skeleton className="h-10 w-1/2" /> : getStatusComponent()}
              </CardContent>
            </Card>
             <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>{dict.admin.dashboard.controlsTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex flex-col sm:flex-row gap-2">
                    {electionStatus === 'ended' ? (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                 <Button disabled={isUpdatingStatus} variant="secondary" className="w-full">
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
                    ) : (
                        <Button onClick={handleEndElection} disabled={isUpdatingStatus || electionStatus === 'ended'} variant="destructive" className="w-full">
                           {isUpdatingStatus && <Loader2 className="animate-spin" />} 
                           {dict.admin.dashboard.endElectionButton}
                        </Button>
                    )}
                 </div>
                 <div className="space-y-2 pt-4 border-t">
                    <Label>Active Election Group</Label>
                    <div className="flex gap-2">
                        <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={isLoading}>
                            <SelectTrigger>
                                <SelectValue placeholder={dict.admin.candidates.groupSelectPlaceholder} />
                            </SelectTrigger>
                            <SelectContent>
                                {groups?.map(group => (
                                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <Button onClick={handleSetActiveGroup} disabled={isUpdatingStatus || !selectedGroupId}>
                            {isUpdatingStatus && <Loader2 className="animate-spin" />}
                            Set
                        </Button>
                    </div>
                 </div>
                 <p className="text-sm text-muted-foreground pt-4 border-t">{dict.admin.dashboard.scheduleTitle}</p>
                  <div className="space-y-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : <span>{dict.admin.dashboard.startDate}</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !endDate && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : <span>{dict.admin.dashboard.endDate}</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Button onClick={handleSetDates} disabled={isUpdatingStatus || !startDate || !endDate} className="w-full">
                        {isUpdatingStatus && <Loader2 className="animate-spin" />}
                        {dict.admin.dashboard.setDatesButton}
                    </Button>
                  </div>
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

    

    