
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Loader2, Vote as VoteIcon, Ban } from "lucide-react";
import { useFirestore, useCollection, useDoc } from "@/firebase";
import { doc, setDoc, serverTimestamp, getDoc, query, where, collection } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { parseISO } from "date-fns";


interface Candidate {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
}

interface ElectionSettings {
    status: 'active' | 'ended';
    startDate?: string;
    endDate?: string;
}

// TODO: Replace with dynamic group selection
const GROUP_ID = "presidential_2024";

export default function VotePage() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [nationalId, setNationalId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const { dict } = useDictionary();
  const db = useFirestore();

  const candidatesQuery = useMemo(() => {
    if (!db) return null;
    // TODO: Filter candidates by selected group
    return query(collection(db, 'candidates'));
  }, [db]);

  const { data: candidates, isLoading: candidatesLoading } = useCollection<Candidate>(
    candidatesQuery ? 'candidates' : null,
    candidatesQuery ?? undefined
  );
  
  const { data: electionSettings, isLoading: settingsLoading } = useDoc<ElectionSettings>('settings/election');
  
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


  useEffect(() => {
    const id = sessionStorage.getItem('nationalId');
    if (id) {
      setNationalId(id);
    } else if (authChecked) { // Only redirect if we've already checked and it's not there
      toast({
        variant: 'destructive',
        title: dict.vote.authErrorTitle,
        description: dict.vote.authErrorDescription,
      });
      router.push('/');
    }
    setAuthChecked(true); // Mark that we have checked for the ID
  }, [router, toast, authChecked, dict]);


  useEffect(() => {
    if (!nationalId || !db) return;

    const fetchVoteStatus = async () => {
        // TODO: check for vote in the selected group
        const voteRef = doc(db, 'votes', `${nationalId}_${GROUP_ID}`);
        const voteSnap = await getDoc(voteRef);
        if (voteSnap.exists()) {
            setHasVoted(true);
        }
    };

    fetchVoteStatus();
  }, [nationalId, db]);


  const handleVoteSubmit = () => {
    if (!selectedCandidate || !nationalId || !db) {
        toast({
            variant: "destructive",
            title: dict.vote.noSelectionErrorTitle,
            description: dict.vote.noSelectionErrorDescription,
        });
        return;
    }
    
    setIsLoading(true);
    
    const voteData = {
        nationalId: nationalId,
        candidateId: selectedCandidate.id,
        candidateName: selectedCandidate.name,
        groupId: GROUP_ID, // TODO: Use dynamic group ID
        votedAt: serverTimestamp(),
    };

    const voteRef = doc(db, 'votes', `${nationalId}_${GROUP_ID}`); // TODO: Use dynamic group ID

    setDoc(voteRef, voteData)
      .then(() => {
        const receipt = `receipt-${nationalId}-${GROUP_ID}-${Date.now()}`;
        toast({
          title: dict.vote.successToastTitle,
          description: dict.vote.successToastDescription,
        });
        router.push(`/confirmation?receipt=${receipt}`);
      })
      .catch((serverError) => {
        setIsLoading(false);
        setIsDialogOpen(false);
        toast({
          variant: "destructive",
          title: dict.vote.errorToastTitle,
          description: dict.vote.errorToastDescription,
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
    if (hasVoted) {
        toast({
            variant: "default",
            title: dict.vote.alreadyVotedToastTitle,
            description: dict.vote.alreadyVotedToastDescription,
        });
        return;
    }
    setSelectedCandidate(candidate);
  }
  
  const isLoadingAnything = candidatesLoading || settingsLoading || !authChecked;

  if (isLoadingAnything && !authChecked) {
      return (
          <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
              <Loader2 className="animate-spin h-8 w-8" />
          </div>
      )
  }
  
  if (hasVoted && !isLoadingAnything) {
    return (
        <div className="container mx-auto py-8 px-4">
             <Card className="w-full max-w-4xl mx-auto shadow-2xl text-center bg-card/80">
                <CardHeader>
                     <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                        <VoteIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-3xl font-bold font-headline text-primary">
                        {dict.vote.alreadyVotedToastTitle}
                    </CardTitle>
                    <CardDescription className="text-lg">
                        {dict.vote.alreadyVotedToastDescription}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/results">
                        <Button variant="outline">{dict.vote.viewResultsButton}</Button>
                    </Link>
                </CardContent>
             </Card>
        </div>
    )
  }

  if (electionStatus === 'ended' || electionStatus === 'pending') {
    const title = electionStatus === 'ended' ? dict.vote.electionEndedTitle : dict.vote.electionPendingTitle;
    const description = electionStatus === 'ended' ? dict.vote.electionEndedDescription : dict.vote.electionPendingDescription;

    return (
        <div className="container mx-auto py-8 px-4">
            <Card className="w-full max-w-4xl mx-auto shadow-2xl text-center bg-card/80">
                <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
                        <Ban className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-3xl font-bold font-headline text-destructive">
                        {title}
                    </CardTitle>
                    <CardDescription className="text-lg">
                        {description}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {electionStatus === 'ended' && (
                        <Link href="/results">
                            <Button>{dict.vote.viewResultsButton}</Button>
                        </Link>
                    )}
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-4xl mx-auto shadow-2xl bg-card/80">
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
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
          ) : candidates && candidates.length > 0 ? (
             <RadioGroup
                value={selectedCandidate?.id ?? undefined}
                onValueChange={(candidateId) => {
                    const cand = candidates?.find(c => c.id === candidateId);
                    if (cand) handleSelectCandidate(cand);
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
                {candidates?.map((candidate) => (
                <Label
                    key={candidate.id}
                    htmlFor={`candidate-${candidate.id}`}
                    className={`flex flex-col text-center items-center gap-4 rounded-lg border-2 p-6 transition-all hover:border-primary ${hasVoted ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${
                    selectedCandidate?.id === candidate.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "border-border"
                    }`}
                >
                    <div className="relative h-32 w-32 rounded-full overflow-hidden">
                        <Image
                            src={candidate.imageUrl}
                            alt={`Portrait of ${candidate.name}`}
                            fill
                            className="object-cover"
                            sizes="128px"
                        />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold">{candidate.name}</h3>
                        <p className="text-sm text-muted-foreground mt-2">{candidate.description}</p>
                    </div>
                    <RadioGroupItem value={candidate.id} id={`candidate-${candidate.id}`} disabled={hasVoted} className="h-5 w-5 mt-4"/>
                </Label>
                ))}
            </RadioGroup>
          ) : (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <VoteIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">
                    {dict.vote.noCandidatesMessage}
                  </p>
                </div>
          )}

          <div className="mt-8 text-center">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" disabled={!selectedCandidate || isLoadingAnything || hasVoted} className="bg-accent text-accent-foreground hover:bg-accent/90">
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
