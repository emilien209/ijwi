"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDictionary } from "@/hooks/use-dictionary";
import { Loader2, CheckCircle, AlertTriangle, Search } from "lucide-react";
import { handleVerifyVote } from "@/app/actions";

const formSchema = z.object({
  receipt: z.string().min(10, "Receipt code is required."),
});

type VerificationStatus = {
  status: "success" | "fail" | null;
  message?: string;
};

export default function VerifyPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({ status: null });

  const { dict } = useDictionary();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      receipt: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setVerificationStatus({ status: null });
    
    const result = await handleVerifyVote(values.receipt);
    
    if (result.success) {
      setVerificationStatus({ status: "success" });
    } else {
      const errorMessage = result.error ? dict.verify[result.error as keyof typeof dict.verify] : dict.verify.failDescription;
      setVerificationStatus({ status: "fail", message: errorMessage });
    }

    setIsLoading(false);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl bg-card/80">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="text-2xl font-bold font-headline text-primary">
                {dict.verify.title}
              </CardTitle>
              <CardDescription>{dict.verify.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="receipt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.verify.receiptLabel}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={dict.verify.receiptPlaceholder}
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {verificationStatus.status === "success" && (
                <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>{dict.verify.successTitle}</AlertTitle>
                  <AlertDescription className="text-green-700">
                    {dict.verify.successDescription}
                  </AlertDescription>
                </Alert>
              )}

              {verificationStatus.status === "fail" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{dict.verify.failTitle}</AlertTitle>
                  <AlertDescription>
                   {verificationStatus.message || dict.verify.failDescription}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardContent>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    {dict.verify.verifyingButton}
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    {dict.verify.verifyButton}
                  </>
                )}
              </Button>
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  );
}
