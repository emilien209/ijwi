"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDictionary } from "@/hooks/use-dictionary";
import { Vote } from "lucide-react";
import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images.json";

export default function DashboardPage() {
  const { dict } = useDictionary();
  const electionImage = placeholderImages.find(p => p.id === "election-banner");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline mb-2 text-primary">
          {dict.dashboard.welcomeTitle}
        </h1>
        <p className="text-lg text-muted-foreground">
          {dict.dashboard.welcomeSubtitle}
        </p>
      </div>

      <Card className="w-full max-w-4xl mx-auto overflow-hidden shadow-2xl">
        {electionImage && (
            <div className="relative h-48 w-full">
                 <Image
                    src={electionImage.imageUrl}
                    alt={electionImage.description}
                    data-ai-hint={electionImage.imageHint}
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
            </div>
        )}
        <div className="p-6 md:p-8">
            <CardHeader className="p-0 mb-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <CardTitle className="text-3xl font-bold font-headline text-primary">
                        {dict.dashboard.electionTitle}
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                        {dict.dashboard.electionDescription}
                    </CardDescription>
                </div>
                <div className="hidden sm:block p-3 bg-primary/10 rounded-full">
                    <Vote className="h-8 w-8 text-primary" />
                </div>
            </div>
            </CardHeader>
            <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                    <p className="text-sm font-semibold text-muted-foreground">{dict.dashboard.startsLabel}</p>
                    <p className="text-lg font-bold">Oct 25, 2024</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-muted-foreground">{dict.dashboard.endsLabel}</p>
                    <p className="text-lg font-bold">Nov 5, 2024</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-muted-foreground">{dict.dashboard.statusLabel}</p>
                    <p className="text-lg font-bold text-green-600">{dict.dashboard.statusActive}</p>
                </div>
            </div>
            <div className="mt-8 text-center">
                <Link href="/vote" passHref>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg transition-transform hover:scale-105">
                    <Vote className="mr-2 h-5 w-5" />
                    {dict.dashboard.voteButton}
                </Button>
                </Link>
            </div>
            </CardContent>
        </div>
      </Card>
    </div>
  );
}
