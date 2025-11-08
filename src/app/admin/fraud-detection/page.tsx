"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { handleFraudAnalysis } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import type { AnalyzeVotingPatternsOutput } from "@/ai/flows/fraud-detection";
import { useDictionary } from "@/hooks/use-dictionary";

const formSchema = z.object({
  votingData: z.string().refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    { message: "Invalid JSON format." }
  ),
});

const mockData = JSON.stringify(
  [
    { "voterId": "V-1001", "candidate": "Candidate A" },
    { "voterId": "V-1002", "candidate": "Candidate B" },
    { "voterId": "V-1003", "candidate": "Candidate A" },
    { "voterId": "V-1004", "candidate": "Candidate A" },
    { "voterId": "V-1001", "candidate": "Candidate B" }
  ],
  null,
  2
);

export default function FraudDetectionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeVotingPatternsOutput | null>(null);
  const { toast } = useToast();
  const { dict } = useDictionary();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      votingData: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setAnalysisResult(null);

    const result = await handleFraudAnalysis({ votingData: values.votingData });

    if (result.success && result.data) {
      setAnalysisResult(result.data);
    } else {
      toast({
        variant: "destructive",
        title: dict.fraud.analysisErrorTitle,
        description: result.error || dict.fraud.analysisErrorDescription,
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{dict.fraud.title}</CardTitle>
          <CardDescription>{dict.fraud.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="votingData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.fraud.dataInputLabel}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={dict.fraud.dataInputPlaceholder}
                        className="min-h-[200px] font-code text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-4">
                <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {dict.fraud.analyzingButton}
                    </>
                  ) : (
                    dict.fraud.analyzeButton
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.setValue("votingData", mockData)}
                >
                  {dict.fraud.loadSampleButton}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {analysisResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{dict.fraud.resultsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>{dict.fraud.summaryTitle}</AlertTitle>
              <AlertDescription>{analysisResult.summary}</AlertDescription>
            </Alert>

            {analysisResult.anomalies && analysisResult.anomalies.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{dict.fraud.anomaliesTitle}</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-2 pl-5">
                    {analysisResult.anomalies.map((anomaly, index) => (
                      <li key={index}>{anomaly}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {analysisResult.anomalies && analysisResult.anomalies.length === 0 && (
                 <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>{dict.fraud.noAnomaliesTitle}</AlertTitle>
                    <AlertDescription>
                        {dict.fraud.noAnomaliesDescription}
                    </AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
