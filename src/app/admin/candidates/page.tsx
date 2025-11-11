
"use client";

import { useState, useRef, useMemo } from "react";
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
  CardDescription,
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
import { PlusCircle, Trash2, User, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, "Name is required."),
  description: z.string().min(10, "A short description is required."),
  imageUrl: z.string().optional(),
  uploadedImage: z.any().optional(),
}).refine(data => data.imageUrl || data.uploadedImage, {
    message: "Either a photo URL or an uploaded image is required.",
    path: ["imageUrl"],
});

type Candidate = { id: string, name: string, description: string, imageUrl: string };

export default function CandidatesPage() {
  const { dict } = useDictionary();
  const { toast } = useToast();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const db = useFirestore();

  const { data: candidates, isLoading: candidatesLoading } = useCollection<Candidate>('candidates');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
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

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    form.setValue("imageUrl", url);
    setPreviewImage(url); // Show preview for URL as well
    form.setValue("uploadedImage", null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    form.clearErrors("imageUrl");
  }


  function onSubmit(values: z.infer<typeof formSchema>) {
    const imageUrl = values.imageUrl || previewImage;

    if (!imageUrl) {
        toast({
            variant: "destructive",
            title: dict.admin.candidates.imageRequired,
            description: dict.admin.candidates.imageRequiredDescription,
        });
        return;
    }

    const newCandidate = {
        name: values.name,
        description: values.description,
        imageUrl: imageUrl,
    };

    const candidatesCol = collection(db, 'candidates');
    
    addDoc(candidatesCol, newCandidate)
        .then(() => {
            toast({
              title: dict.appName,
              description: dict.admin.candidates.addSuccess.replace('{candidateName}', values.name),
            });
            form.reset();
            setPreviewImage(null);
            if(fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        })
        .catch(serverError => {
             const permissionError = new FirestorePermissionError({
                path: candidatesCol.path,
                operation: 'create',
                requestResourceData: newCandidate,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  }

  const removeCandidate = (candidate: Candidate) => {
    if (!db) return;
    const docRef = doc(db, 'candidates', candidate.id);
    deleteDoc(docRef)
        .then(() => {
             toast({ 
              title: dict.appName,
              description: dict.admin.candidates.removeSuccess.replace('{candidateName}', candidate.name),
            });
        })
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{dict.admin.candidates.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {candidatesLoading ? (
                 <div className="space-y-4">
                    <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                        {[...Array(2)].map((_, i) => (
                            <Card key={i} className="overflow-hidden">
                                <div className="flex items-start p-4 gap-4">
                                    <Skeleton className="h-24 w-24 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                        <Skeleton className="h-9 w-full mt-2" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                 </div>
              ) : candidates && candidates.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                  {candidates.map((candidate) => (
                    <Card key={candidate.id} className="overflow-hidden flex flex-col">
                      <CardContent className="p-6 flex items-start gap-6">
                        <div className="relative h-24 w-24 rounded-full overflow-hidden flex-shrink-0">
                           <Image 
                              src={candidate.imageUrl}
                              alt={`Portrait of ${candidate.name}`}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-xl">{candidate.name}</CardTitle>
                            <CardDescription className="mt-2 text-sm">
                                {candidate.description}
                            </CardDescription>
                        </div>
                      </CardContent>
                      <CardFooter className="p-6 pt-0 mt-auto">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="w-full" 
                          onClick={() => removeCandidate(candidate)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> 
                          {dict.admin.candidates.removeButton}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <User className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">
                    {dict.admin.candidates.noCandidates}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{dict.admin.candidates.addTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{dict.admin.candidates.nameLabel}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={dict.admin.candidates.namePlaceholder} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{dict.admin.candidates.descriptionLabel}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={dict.admin.candidates.descriptionPlaceholder}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Tabs defaultValue="url" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="url">{dict.admin.candidates.tabUrl}</TabsTrigger>
                      <TabsTrigger value="upload">{dict.admin.candidates.tabUpload}</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="url" className="pt-4">
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{dict.admin.candidates.photoUrlLabel}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={dict.admin.candidates.photoUrlPlaceholder}
                                {...field}
                                onChange={handleUrlChange}
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
                            <FormLabel>{dict.admin.candidates.uploadLabel}</FormLabel>
                            <FormControl>
                              <div className="flex items-center justify-center w-full">
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-2 text-muted-foreground"/>
                                    <p className="mb-2 text-sm text-center text-muted-foreground">
                                      <span className="font-semibold">{dict.admin.candidates.uploadHint}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">{dict.admin.candidates.uploadHintSmall}</p>
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
                    {dict.admin.candidates.addButton}
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
