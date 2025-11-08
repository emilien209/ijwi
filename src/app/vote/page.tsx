"use client";

import { useState } from "react";
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useDictionary } from "@/hooks/use-dictionary";
import { Loader2, Vote as VoteIcon } from "lucide-react";
import { placeholderImages } from "@/lib/placeholder-images.json";

const candidates = [
  { id: "1", name: "Candidate A", imageId: "candidate-a" },
  { id: "2", name: "Candidate B", imageId: "candidate-b" },
  { id: "3", name: "Candidate C", imageId: "candidate-c" },
];

export default function VotePage() {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { dict } = useDictionary();

  const handleVoteSubmit = () => {
    setIsLoading(true);
    // Simulate API call to submit vote and get a receipt
    setTimeout(() => {
      // In a real app, this hash would come from a cryptographic process
      const receipt = `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      toast({
        title: dict.vote.successToastTitle,
        description: dict.vote.successToastDescription,
      });

      router.push(`/confirmation?receipt=${receipt}`);
    }, 2000);
  };
  
  const getCandidateName = (id: string | null) => {
    return candidates.find(c => c.id === id)?.name || "";
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
          <RadioGroup
            value={selectedCandidate ?? undefined}
            onValueChange={setSelectedCandidate}
            className="space-y-4"
          >
            {candidates.map((candidate) => {
              const candidateImage = placeholderImages.find(p => p.id === candidate.imageId);
              return (
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
                 {candidateImage && (
                    <div className="relative h-16 w-16 rounded-full overflow-hidden">
                        <Image
                            src={candidateImage.imageUrl}
                            alt={candidateImage.description}
                            data-ai-hint={candidateImage.imageHint}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}
                <span className="text-xl font-semibold">{candidate.name}</span>
              </Label>
            )})}
          </RadioGroup>

          <div className="mt-8 text-center">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" disabled={!selectedCandidate} className="bg-accent text-accent-foreground hover:bg-accent/90">
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
