
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
import { Loader2, ShieldCheck, ArrowRight, Users, Info } from "lucide-react";
import { handleNidaVerification } from "@/app/actions";
import { format, parse } from 'date-fns';
import { AnimatePresence, motion } from "framer-motion";
import { useCollection } from "@/firebase";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  akarere: z.string().min(1, "District is required."),
  umurenge: z.string().min(1, "Sector is required."),
});

interface Candidate {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
}

type Step = 'id' | 'dob' | 'location';


export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>('id');
  const router = useRouter();
  const { toast } = useToast();
  const { dict } = useDictionary();
  const { data: candidates, isLoading: candidatesLoading } = useCollection<Candidate>("candidates");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nationalId: "",
      dob: "",
      akarere: "",
      umurenge: ""
    },
  });

  const handleNextStep = async () => {
    if (step === 'id') {
        const isIdValid = await form.trigger("nationalId");
        if (isIdValid) setStep('dob');
    } else if (step === 'dob') {
        const isDobValid = await form.trigger("dob");
        if (isDobValid) setStep('location');
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const parsedDate = parseFlexibleDate(values.dob);
    if (!parsedDate) {
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
      akarere: values.akarere,
      umurenge: values.umurenge,
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

  const renderStepButtons = () => {
      if (step === 'location') {
          return (
             <div className="w-full space-y-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? ( <Loader2 className="animate-spin" /> ) : ( dict.login.loginButton )}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => setStep('dob')} disabled={isLoading}>
                    Back
                </Button>
            </div>
          )
      }

      return (
         <div className="w-full space-y-2">
            <Button type="button" className="w-full" onClick={handleNextStep}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
             {step === 'dob' && (
                 <Button type="button" variant="outline" className="w-full" onClick={() => setStep('id')} disabled={isLoading}>
                    Back
                </Button>
            )}
        </div>
      )
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <Card className="w-full max-w-md shadow-2xl bg-card/80 mx-auto">
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
              <CardContent className="space-y-4 overflow-hidden min-h-[160px]">
                   <Alert variant="default" className="border-accent">
                    <Info className="h-4 w-4 text-accent" />
                    <AlertTitle className="text-accent">Demonstration Only</AlertTitle>
                    <AlertDescription>
                        This is a demo application to showcase e-voting technology. The names, images, and data are fictional and not for official use. Do not use real personal information.
                    </AlertDescription>
                </Alert>
                  <AnimatePresence mode="wait">
                      <motion.div
                          key={step}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ duration: 0.3 }}
                      >
                          {step === 'id' && (
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
                          )}
                          {step === 'dob' && (
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
                          )}
                          {step === 'location' && (
                              <div className="space-y-4">
                                  <FormField
                                      control={form.control}
                                      name="akarere"
                                      render={({ field }) => (
                                      <FormItem>
                                          <FormLabel>Akarere (District)</FormLabel>
                                          <FormControl>
                                          <Input
                                              placeholder="e.g., Gasabo"
                                              {...field}
                                              disabled={isLoading}
                                          />
                                          </FormControl>
                                          <FormMessage />
                                      </FormItem>
                                      )}
                                  />
                                   <FormField
                                      control={form.control}
                                      name="umurenge"
                                      render={({ field }) => (
                                      <FormItem>
                                          <FormLabel>Umurenge (Sector)</FormLabel>
                                          <FormControl>
                                          <Input
                                              placeholder="e.g., Remera"
                                              {...field}
                                              disabled={isLoading}
                                          />
                                          </FormControl>
                                          <FormMessage />
                                      </FormItem>
                                      )}
                                  />
                              </div>
                          )}
                    </motion.div>
                </AnimatePresence>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                  {renderStepButtons()}
              </CardFooter>
            </form>
          </Form>
        </Card>
        
        <div className="w-full">
            <Card className="bg-card/80 shadow-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary font-headline">
                        <Users /> {dict.navCandidates}
                    </CardTitle>
                    <CardDescription>{dict.vote.description}</CardDescription>
                </CardHeader>
                <CardContent>
                     {candidatesLoading ? (
                        <div className="space-y-4">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-16 w-16 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[150px]" />
                                        <Skeleton className="h-4 w-[100px]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : candidates && candidates.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[400px] overflow-y-auto p-1">
                            {candidates.map(candidate => (
                                <div key={candidate.id} className="flex items-center gap-4">
                                    <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0">
                                        <Image 
                                            src={candidate.imageUrl}
                                            alt={`Portrait of ${candidate.name}`}
                                            fill
                                            className="object-cover"
                                            sizes="64px"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{candidate.name}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{candidate.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">{dict.vote.noCandidatesMessage}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
