
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useDictionary } from "@/hooks/use-dictionary";
import { Loader2, Vote as VoteIcon, ChevronDown, Check, Ban, AlertCircle } from "lucide-react";
import { useFirestore, useCollection, useDoc } from "@/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import Link from "next/link";


interface Candidate {
  id: string;
  name: string;
  imageUrl: string;
  groupId: string;
}

interface ElectionGroup {
    id: string;
    name: string;
    description?: string;
}

interface ElectionSettings {
    status: 'active' | 'ended';
}

export default function VotePage() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [votedGroups, setVotedGroups] = useState<string[]>([]);
  const [nationalId, setNationalId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const { dict } = useDictionary();
  const db = useFirestore();

  const { data: candidates, isLoading: candidatesLoading } = useCollection<Candidate>("candidates");
  const { data: groups, isLoading: groupsLoading } = useCollection<ElectionGroup>("groups");
  const { data: electionSettings, isLoading: settingsLoading } = useDoc<ElectionSettings>('settings/election');
  
  const electionStatus = electionSettings?.status || "active";

  useEffect(() => {
    const id = sessionStorage.getItem('nationalId');
    if (!id) {
        if (authChecked) {
             toast({
                variant: 'destructive',
                title: "Authentication Error",
                description: "National ID not found. Please log in again.",
            });
            router.push('/');
        }
    } else {
      setNationalId(id);
    }
    setAuthChecked(true);
  }, [router, toast, authChecked]);

  useEffect(() => {
    if (!nationalId || !db || !groups) return;

    const fetchVotedGroups = async () => {
        const voted: string[] = [];
        for (const group of groups) {
            const voteRef = doc(db, 'votes', `${nationalId}_${group.id}`);
            const voteSnap = await getDoc(voteRef);
            if (voteSnap.exists()) {
                voted.push(group.id);
            }
        }
        setVotedGroups(voted);
    };

    fetchVotedGroups();
  }, [nationalId, db, groups]);


  const handleVoteSubmit = () => {
    if (!selectedCandidate || !nationalId || !db) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please select a candidate and make sure you are logged in.",
        });
        return;
    }
    
    setIsLoading(true);
    
    const voteData = {
        nationalId: nationalId,
        candidateId: selectedCandidate.id,
        candidateName: selectedCandidate.name,
        groupId: selectedCandidate.groupId,
        votedAt: serverTimestamp(),
    };

    const voteRef = doc(db, 'votes', `${nationalId}_${selectedCandidate.groupId}`);

    setDoc(voteRef, voteData)
      .then(() => {
        const receipt = `receipt-${nationalId}-${selectedCandidate.groupId}-${Date.now()}`;
        toast({
          title: dict.vote.successToastTitle,
          description: dict.vote.successToastDescription,
        });
        router.push(`/confirmation?receipt=${receipt}`);
      })
      .catch((serverError) => {
        setIsLoading(false);
        // Do not close the dialog on error
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: "Your vote could not be submitted. Please try again.",
        });
        const permissionError = new FirestorePermissionError({
          path: voteRef.path,
          operation: 'create',
          requestResourceData: voteData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };
  
  const handleSelectCandidate = (candidate: Candidate) => {
    if (votedGroups.includes(candidate.groupId)) {
        toast({
            variant: "default",
            title: "Already Voted",
            description: "You have already cast a vote in this group.",
        });
        return;
    }
    setSelectedCandidate(candidate);
  }
  
  const isLoadingAnything = candidatesLoading || groupsLoading || settingsLoading || !authChecked;

  if (!authChecked) {
      return (
          <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
              <Loader2 className="animate-spin h-8 w-8" />
          </div>
      )
  }

  if (electionStatus === 'ended' && !settingsLoading) {
    return (
        <div className="container mx-auto py-8 px-4">
            <Card className="w-full max-w-4xl mx-auto shadow-2xl text-center">
                <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
                        <Ban className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-3xl font-bold font-headline text-destructive">
                        The Election Has Ended
                    </CardTitle>
                    <CardDescription className="text-lg">
                        The voting period is now closed. Thank you for your participation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/results">
                        <Button>View Final Results</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold font-headline text-primary">
            {dict.vote.title}
          </CardTitle>
          <CardDescription className="text-lg">
            {dict.vote.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAnything ? (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : (
            <div className="space-y-4">
                {groups?.map(group => {
                    const groupCandidates = candidates?.filter(c => c.groupId === group.id) || [];
                    const hasVotedInGroup = votedGroups.includes(group.id);

                    if (groupCandidates.length === 0) {
                      return (
                         <div key={group.id} className="flex flex-col justify-between items-center w-full p-4 rounded-lg border-2 bg-muted/30">
                            <div className="text-left w-full mb-4">
                                <h3 className="text-lg font-semibold">{group.name}</h3>
                                <p className="text-sm text-muted-foreground">{group.description}</p>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground text-sm p-4 border-2 border-dashed rounded-lg w-full justify-center">
                              <AlertCircle className="h-5 w-5" />
                              <span>No candidates have been added to this group yet.</span>
                            </div>
                        </div>
                      )
                    }

                    return (
                        <Collapsible key={group.id} open={openGroup === group.id} onOpenChange={() => setOpenGroup(openGroup === group.id ? null : group.id)}>
                            <CollapsibleTrigger asChild>
                                <div className="flex justify-between items-center w-full p-4 rounded-lg border-2 cursor-pointer bg-muted/50 hover:border-primary">
                                    <div className="text-left">
                                        <h3 className="text-lg font-semibold">{group.name}</h3>
                                        <p className="text-sm text-muted-foreground">{group.description}</p>
                                    </div>
                                    {hasVotedInGroup ? (
                                        <div className="flex items-center gap-2 text-green-600">
                                            <Check className="h-5 w-5" />
                                            <span>Voted</span>
                                        </div>
                                    ) : (
                                        <ChevronDown className={cn("h-6 w-6 transition-transform", openGroup === group.id && "rotate-180")} />
                                    )}
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="py-4 px-2">
                                <RadioGroup
                                    value={selectedCandidate?.id ?? undefined}
                                    onValueChange={(candidateId) => {
                                        const cand = groupCandidates.find(c => c.id === candidateId);
                                        if (cand) handleSelectCandidate(cand);
                                    }}
                                    className="space-y-4"
                                >
                                    {groupCandidates.map((candidate) => (
                                    <Label
                                        key={candidate.id}
                                        htmlFor={`candidate-${candidate.id}`}
                                        className={`flex items-center gap-4 rounded-lg border-2 p-4 transition-all hover:border-primary ${hasVotedInGroup ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${
                                        selectedCandidate?.id === candidate.id
                                            ? "border-primary bg-primary/5 ring-2 ring-primary"
                                            : "border-border"
                                        }`}
                                    >
                                        <RadioGroupItem value={candidate.id} id={`candidate-${candidate.id}`} disabled={hasVotedInGroup}/>
                                        <div className="relative h-16 w-16 rounded-full overflow-hidden">
                                            <Image
                                                src={candidate.imageUrl}
                                                alt={`Portrait of ${candidate.name}`}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                            />
                                        </div>
                                        <span className="text-xl font-semibold">{candidate.name}</span>
                                    </Label>
                                    ))}
                                </RadioGroup>
                            </CollapsibleContent>
                        </Collapsible>
                    )
                })}
            </div>
          )}

          <div className="mt-8 text-center">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" disabled={!selectedCandidate || isLoadingAnything || (selectedCandidate && votedGroups.includes(selectedCandidate.groupId))} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <VoteIcon className="mr-2 h-5 w-5" />
                  {dict.vote.previewButton}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{dict.vote.confirmTitle}</DialogTitle>
                  <DialogDescription>
                    {dict.vote.confirmDescription}
                  </DialogDescription>
                </DialogHeader>
                <div className="my-4 rounded-lg border bg-muted p-4 text-center">
                  <p className="text-sm font-medium text-muted-foreground">{dict.vote.youSelectedLabel}</p>
                  <p className="text-2xl font-bold text-primary">{selectedCandidate?.name}</p>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" disabled={isLoading}>{dict.vote.cancelButton}</Button>
                  </DialogClose>
                  <Button onClick={handleVoteSubmit} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {dict.vote.submittingButton}
                      </>
                    ) : (
                      dict.vote.submitButton
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
