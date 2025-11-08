
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
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useDictionary } from "@/hooks/use-dictionary";
import { Loader2, Vote as VoteIcon } from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";

interface Candidate {
  id: string;
  name: string;
  imageUrl: string;
}

export default function VotePage() {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { dict } = useDictionary();
  const db = useFirestore();

  const { data: candidates, isLoading: candidatesLoading } = useCollection<Candidate>("candidates");

  const [nationalId, setNationalId] = useState<string | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem('nationalId');
    if (!id) {
      toast({
        variant: 'destructive',
        title: "Authentication Error",
        description: "National ID not found. Please log in again.",
      });
      router.push('/');
    } else {
      setNationalId(id);
    }
  }, [router, toast]);


  const handleVoteSubmit = () => {
    if (!selectedCandidate || !nationalId) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please select a candidate and make sure you are logged in.",
        });
        return;
    }
    
    setIsLoading(true);
    
    const voteData = {
        candidateId: selectedCandidate,
        candidateName: getCandidateName(selectedCandidate),
        votedAt: serverTimestamp(),
    };

    const voteRef = doc(db, 'votes', nationalId);

    setDoc(voteRef, voteData)
      .then(() => {
        const receipt = `receipt-${nationalId}-${Date.now()}`;
        toast({
          title: dict.vote.successToastTitle,
          description: dict.vote.successToastDescription,
        });
        router.push(`/confirmation?receipt=${receipt}`);
      })
      .catch((serverError) => {
        setIsLoading(false);
        setIsDialogOpen(false);
        const permissionError = new FirestorePermissionError({
          path: voteRef.path,
          operation: 'create',
          requestResourceData: voteData,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: "destructive",
            title: "Vote Failed",
            description: "Could not submit your vote. You may have already voted or there was a server error.",
        });
      });
  };
  
  const getCandidateName = (id: string | null) => {
    return candidates?.find(c => c.id === id)?.name || "";
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
          {candidatesLoading ? (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-lg border-2 p-4">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <Skeleton className="h-6 w-40" />
                    </div>
                ))}
            </div>
          ) : (
          <RadioGroup
            value={selectedCandidate ?? undefined}
            onValueChange={setSelectedCandidate}
            className="space-y-4"
          >
            {candidates?.map((candidate) => (
              <Label
                key={candidate.id}
                htmlFor={`candidate-${candidate.id}`}
                className={`flex items-center gap-4 rounded-lg border-2 p-4 transition-all hover:border-primary cursor-pointer ${
                  selectedCandidate === candidate.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "border-border"
                }`}
              >
                <RadioGroupItem value={candidate.id} id={`candidate-${candidate.id}`} />
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
          )}

          <div className="mt-8 text-center">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" disabled={!selectedCandidate || candidatesLoading} className="bg-accent text-accent-foreground hover:bg-accent/90">
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
                  <p className="text-2xl font-bold text-primary">{getCandidateName(selectedCandidate)}</p>
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
