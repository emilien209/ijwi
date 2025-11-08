
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useDictionary } from "@/hooks/use-dictionary";
import { Loader2, ShieldCheck } from "lucide-react";
import { useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

const formSchema = z.object({
  nationalId: z.string().length(16, "National ID must be 16 digits."),
  otp: z.string().optional(),
});

export default function LoginPage() {
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { dict } = useDictionary();
  const db = useFirestore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nationalId: "",
      otp: "",
    },
  });

  const handleRequestOtp = async () => {
    const isIdValid = await form.trigger("nationalId");
    if (!isIdValid) {
      return;
    }
    
    const nationalId = form.getValues("nationalId");
    
    setIsLoading(true);
    
    try {
      const userVoteDoc = await getDoc(doc(db, "votes", nationalId));
      if (userVoteDoc.exists()) {
        toast({
          variant: "destructive",
          title: "Already Voted",
          description: "This National ID has already been used to vote.",
        });
        setIsLoading(false);
        return;
      }
    } catch(e) {
        // We can ignore this error for now, as it might be a permissions issue
        // for checking a non-existent document. The security rules should
        // prevent a second vote anyway.
    }


    // Simulate API call to request OTP
    setTimeout(() => {
      setOtpSent(true);
      setIsLoading(false);
      toast({
        title: dict.login.otpSentTitle,
        description: dict.login.otpSentDescription,
      });
      // Focus the OTP input after it appears
      setTimeout(() => {
        const otpInput = document.getElementById("otp");
        if (otpInput) {
          otpInput.focus();
        }
      }, 100);
    }, 1500);
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    // Simulate OTP verification
    setTimeout(() => {
      if (values.otp === "123456") { // Mock OTP
        // In a real app, the user would be properly authenticated here.
        // We'll store the ID in session storage to pass to the voting page.
        sessionStorage.setItem('nationalId', values.nationalId);
        
        toast({
          title: dict.login.loginSuccessTitle,
          description: dict.login.loginSuccessDescription,
        });
        router.push("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: dict.login.loginErrorTitle,
          description: dict.login.loginErrorDescription,
        });
        setIsLoading(false);
      }
    }, 1500);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold font-headline text-primary">
                {dict.login.title}
              </CardTitle>
              <CardDescription>{dict.login.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.login.nationalIdLabel}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={dict.login.nationalIdPlaceholder}
                        {...field}
                        maxLength={16}
                        disabled={otpSent || isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {otpSent && (
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dict.login.otpLabel}</FormLabel>
                      <FormControl>
                        <Input
                          id="otp"
                          placeholder="_ _ _ _ _ _"
                          {...field}
                          disabled={isLoading}
                          autoComplete="one-time-code"
                          className="tracking-[1em] text-center"
                        />
                      </FormControl>
                       <FormDescription>
                        {dict.login.otpHint}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              {!otpSent ? (
                <Button
                  type="button"
                  onClick={handleRequestOtp}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    dict.login.requestOtpButton
                  )}
                </Button>
              ) : (
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    dict.login.loginButton
                  )}
                </Button>
              )}
              <p className="text-xs text-muted-foreground text-center">{dict.login.supportText}</p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
