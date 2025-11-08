"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { PlusCircle, Trash2, User, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  name: z.string().min(2, "Name is required."),
  imageUrl: z.string().optional(),
  uploadedImage: z.any().optional(),
}).refine(data => data.imageUrl || data.uploadedImage, {
    message: "Either a photo URL or an uploaded image is required.",
    path: ["imageUrl"],
});

type Candidate = { id: string, name: string, imageUrl: string };

const initialCandidates: Candidate[] = [
  { id: "1", name: "Candidate A", imageUrl: placeholderImages.find(p => p.id === 'candidate-a')?.imageUrl || "https://picsum.photos/seed/1/150/150" },
  { id: "2", name: "Candidate B", imageUrl: placeholderImages.find(p => p.id === 'candidate-b')?.imageUrl || "https://picsum.photos/seed/2/150/150" },
  { id: "3", name: "Candidate C", imageUrl: placeholderImages.find(p => p.id === 'candidate-c')?.imageUrl || "https://picsum.photos/seed/3/150/150" },
];

export default function CandidatesPage() {
  const { dict } = useDictionary();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      imageUrl: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("uploadedImage", file);
      form.setValue("imageUrl", ""); // Clear URL field
      form.clearErrors("imageUrl");
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const imageUrl = values.imageUrl || previewImage;

    if (!imageUrl) {
        toast({
            variant: "destructive",
            title: "Image Required",
            description: "Please provide an image URL or upload a file.",
        });
        return;
    }

    const newCandidate: Candidate = {
        name: values.name,
        imageUrl: imageUrl,
        id: `candidate-${Date.now()}`,
    };
    
    setCandidates(prev => [...prev, newCandidate]);
    toast({
      title: "Candidate Added",
      description: `${values.name} has been added to the list.`,
    });
    form.reset();
    setPreviewImage(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const removeCandidate = (candidate: Candidate) => {
    setCandidates(prev => prev.filter(c => c.id !== candidate.id));
    toast({ 
      title: "Candidate Removed", 
      description: `${candidate.name} has been removed.`, 
      variant: 'destructive'
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{dict.admin?.currentCandidates || "Current Candidates"}</CardTitle>
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
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://picsum.photos/seed/error/150/150';
                          }}
                        />
                      </div>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg">{candidate.name}</CardTitle>
                      </CardHeader>
                      <CardFooter className="p-4 pt-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full" 
                          onClick={() => removeCandidate(candidate)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> 
                          Remove
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <User className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">
                    {dict.admin?.noCandidates || "No candidates added yet."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{dict.admin?.addCandidate || "Add Candidate"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{dict.admin?.candidateName || "Candidate Name"}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={dict.admin?.candidateNamePlaceholder || "Enter candidate name"} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Tabs defaultValue="url" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="url">From URL</TabsTrigger>
                      <TabsTrigger value="upload">Upload</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="url" className="pt-4">
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{dict.admin?.candidatePhoto || "Candidate Photo"}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={dict.admin?.candidatePhotoPlaceholder || "https://example.com/photo.jpg"} 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setPreviewImage(null);
                                  form.setValue("uploadedImage", null);
                                  form.clearErrors("imageUrl");
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="upload" className="pt-4">
                      <FormField
                        control={form.control}
                        name="uploadedImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Upload Image</FormLabel>
                            <FormControl>
                              <div className="flex items-center justify-center w-full">
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-2 text-muted-foreground"/>
                                    <p className="mb-2 text-sm text-center text-muted-foreground">
                                      <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG or GIF (MAX. 5MB)</p>
                                  </div>
                                  <Input 
                                    id="dropzone-file" 
                                    type="file" 
                                    className="hidden" 
                                    onChange={handleFileChange} 
                                    accept="image/png, image/jpeg, image/gif" 
                                    ref={fileInputRef}
                                  />
                                </label>
                              </div> 
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                  
                  {previewImage && (
                    <div className="relative w-full h-40 rounded-md overflow-hidden border">
                      <Image 
                        src={previewImage} 
                        alt="Preview" 
                        fill
                        className="object-cover"
                        sizes="400px"
                      />
                    </div>
                  )}

                  <Button type="submit" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    {dict.admin?.addCandidate || "Add Candidate"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
