
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useDictionary } from "@/hooks/use-dictionary";
import { Loader2, ShieldCheck } from "lucide-react";
import { handleNidaVerification } from "@/app/actions";

const formSchema = z.object({
  nationalId: z.string().length(16, "National ID must be 16 digits."),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { dict } = useDictionary();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nationalId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const result = await handleNidaVerification({ nationalId: values.nationalId });

    if (result.success && result.data) {
      // Store the ID in session storage to pass to the voting page.
      sessionStorage.setItem('nationalId', values.nationalId);
      sessionStorage.setItem('voterName', result.data.fullName || "Voter");
      
      toast({
        title: dict.login.loginSuccessTitle,
        description: `Welcome, ${result.data.fullName}! ${dict.login.loginSuccessDescription}`,
      });
      router.push("/dashboard");

    } else {
      toast({
        variant: "destructive",
        title: dict.login.loginErrorTitle,
        description: result.error || dict.login.loginErrorDescription,
      });
      setIsLoading(false);
    }
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
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  dict.login.loginButton
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">{dict.login.supportText}</p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
