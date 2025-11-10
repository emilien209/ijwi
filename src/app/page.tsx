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
import { format, parse } from 'date-fns';

// This function attempts to parse a date string from various common formats
const parseFlexibleDate = (dateString: string): Date | null => {
  const formats = [
    'yyyy-MM-dd',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'M/d/yy',
    'dd-MM-yyyy',
    'yyyy.MM.dd',
  ];
  for (const fmt of formats) {
    try {
      const parsedDate = parse(dateString, fmt, new Date());
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    } catch (e) {
      // Ignore parsing errors and try the next format
    }
  }
  return null;
};


const formSchema = z.object({
  nationalId: z.string().length(16, "National ID must be 16 digits."),
  dob: z.string().refine((val) => val && parseFlexibleDate(val) !== null, {
    message: "Invalid date format. Please enter a valid date.",
  }),
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
      dob: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const parsedDate = parseFlexibleDate(values.dob);
    if (!parsedDate) {
        // This should theoretically not be reached due to Zod validation, but as a safeguard:
        toast({
            variant: "destructive",
            title: dict.login.loginErrorTitle,
            description: dict.login.invalidDate,
        });
        setIsLoading(false);
        return;
    }
    const formattedDob = format(parsedDate, 'yyyy-MM-dd');


    const result = await handleNidaVerification({
      nationalId: values.nationalId,
      dob: formattedDob,
    });

    if (result.success && result.data?.fullName) {
      const voterName = result.data.fullName;
      sessionStorage.setItem('nationalId', values.nationalId);
      sessionStorage.setItem('voterName', voterName);
      
      toast({
        title: dict.login.loginSuccessTitle,
        description: dict.login.loginSuccessDescription.replace('{voterName}', voterName),
      });
      router.push("/dashboard");

    } else {
      toast({
        variant: "destructive",
        title: dict.login.loginErrorTitle,
        description: result.error ? dict.login[result.error as keyof typeof dict.login] : dict.login.loginErrorDefault,
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl bg-card/80">
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
               <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.login.dobLabel}</FormLabel>
                    <FormControl>
                       <Input
                        placeholder={dict.login.dobPlaceholder}
                        {...field}
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
