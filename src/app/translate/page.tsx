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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { handleTranslation } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRightLeft } from "lucide-react";
import { useDictionary } from "@/hooks/use-dictionary";
import type { MultilingualSupportOutput } from "@/ai/flows/multilingual-support";

const formSchema = z.object({
  text: z.string().min(1, "Text is required."),
  language: z.enum(["en", "fr", "kin"]),
});

export default function TranslatePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [translationResult, setTranslationResult] = useState<MultilingualSupportOutput | null>(null);
  const { toast } = useToast();
  const { dict } = useDictionary();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      language: "fr",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setTranslationResult(null);

    const result = await handleTranslation({
      text: values.text,
      language: values.language as "en" | "fr" | "kin",
    });

    if (result.success && result.data) {
      setTranslationResult(result.data);
    } else {
      toast({
        variant: "destructive",
        title: dict.translate.errorTitle,
        description: result.error || dict.translate.errorDescription,
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>{dict.translate.title}</CardTitle>
          <CardDescription>{dict.translate.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.translate.textLabel}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={dict.translate.textPlaceholder}
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.translate.languageLabel}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={dict.translate.languagePlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">{dict.translate.langEnglish}</SelectItem>
                        <SelectItem value="fr">{dict.translate.langFrench}</SelectItem>
                        <SelectItem value="kin">{dict.translate.langKinyarwanda}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {dict.translate.translatingButton}
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    {dict.translate.translateButton}
                  </>
                )}
              </Button>
            </form>
          </Form>

          {translationResult && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">{dict.translate.resultTitle}</h3>
              <div className="p-4 bg-muted rounded-md border min-h-[150px]">
                {translationResult.translatedText}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
