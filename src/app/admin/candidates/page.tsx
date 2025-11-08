
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useDictionary } from "@/hooks/use-dictionary";
import { placeholderImages } from "@/lib/placeholder-images";
import { PlusCircle, Trash2, User } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name is required."),
  imageUrl: z.string().url("Must be a valid URL."),
});

type Candidate = z.infer<typeof formSchema> & { id: string, imageId: string };

const initialCandidates: Candidate[] = [
  { id: "1", name: "Candidate A", imageUrl: placeholderImages.find(p => p.id === "candidate-a")?.imageUrl || '', imageId: "candidate-a" },
  { id: "2", name: "Candidate B", imageUrl: placeholderImages.find(p => p.id === "candidate-b")?.imageUrl || '', imageId: "candidate-b" },
  { id: "3", name: "Candidate C", imageUrl: placeholderImages.find(p => p.id === "candidate-c")?.imageUrl || '', imageId: "candidate-c" },
];


export default function CandidatesPage() {
  const { dict } = useDictionary();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      imageUrl: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newCandidate: Candidate = {
        ...values,
        id: `candidate-${Date.now()}`,
        imageId: `custom-${Date.now()}`
    }
    setCandidates(prev => [...prev, newCandidate]);
    toast({
      title: "Candidate Added",
      description: `${values.name} has been added to the list.`,
    });
    form.reset();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{dict.admin.currentCandidates}</CardTitle>
                </CardHeader>
                <CardContent>
                    {candidates.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {candidates.map((candidate) => (
                        <Card key={candidate.id} className="overflow-hidden">
                            <div className="relative h-40 w-full bg-muted">
                                <Image 
                                    src={candidate.imageUrl}
                                    alt={`Portrait of ${candidate.name}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <CardHeader className="p-4">
                                <CardTitle className="text-lg">{candidate.name}</CardTitle>
                            </CardHeader>
                            <CardFooter className="p-4 pt-0">
                                <Button variant="outline" size="sm" className="w-full" onClick={() => {
                                    setCandidates(prev => prev.filter(c => c.id !== candidate.id))
                                    toast({ title: "Candidate Removed", description: `${candidate.name} has been removed.`, variant: 'destructive'})
                                }}>
                                    <Trash2 className="mr-2" /> Remove
                                </Button>
                            </CardFooter>
                        </Card>
                        ))}
                    </div>
                    ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg">
                        <User className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">{dict.admin.noCandidates}</p>
                    </div>
                    )}
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>{dict.admin.addCandidate}</CardTitle>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{dict.admin.candidateName}</FormLabel>
                                <FormControl>
                                    <Input placeholder={dict.admin.candidateNamePlaceholder} {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{dict.admin.candidatePhoto}</FormLabel>
                                <FormControl>
                                    <Input placeholder={dict.admin.candidatePhotoPlaceholder} {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">
                            <PlusCircle className="mr-2"/>
                            {dict.admin.addCandidate}
                        </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
