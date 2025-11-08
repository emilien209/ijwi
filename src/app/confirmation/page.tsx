
"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDictionary } from "@/hooks/use-dictionary";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { dict } = useDictionary();

  const receipt = searchParams.get("receipt");

  if (!receipt) {
    // Handle case where user lands here without a receipt
    return (
      <Card className="w-full max-w-lg text-center shadow-2xl">
        <CardHeader>
          <CardTitle className="text-destructive">{dict.confirmation.errorTitle}</CardTitle>
          <CardDescription>{dict.confirmation.errorDescription}</CardDescription>
        </CardHeader>
        <CardContent>
           <Button onClick={() => router.push('/dashboard')}>{dict.confirmation.backToDashboardButton}</Button>
        </CardContent>
      </Card>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(receipt);
    toast({
      title: dict.confirmation.copySuccessTitle,
      description: dict.confirmation.copySuccessDescription,
    });
  };

  return (
    <Card className="w-full max-w-lg text-center shadow-2xl">
      <CardHeader>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-primary font-headline">
          {dict.confirmation.title}
        </CardTitle>
        <CardDescription>
          {dict.confirmation.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-semibold">{dict.confirmation.receiptLabel}</p>
        <div className="relative rounded-lg border bg-muted p-4 font-mono text-sm break-all">
          {receipt}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={handleCopy}
            aria-label="Copy receipt code"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
         {dict.confirmation.verifyInstruction}
        </p>
      </CardContent>
      <CardFooter className="flex justify-center gap-4">
          <Link href="/verify">
             <Button className="bg-accent text-accent-foreground hover:bg-accent/90">{dict.confirmation.verifyNowButton}</Button>
          </Link>
          <Link href="/dashboard">
             <Button variant="outline">{dict.confirmation.backToDashboardButton}</Button>
          </Link>
      </CardFooter>
    </Card>
  );
}


export default function ConfirmationPage() {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <ConfirmationContent />
            </Suspense>
        </div>
    )
}
