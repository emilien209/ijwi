
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const formSchema = z.object({
  name: z.string().min(2, "Name is required."),
  groupId: z.string().min(1, "Group is required."),
  imageUrl: z.string().optional(),
  uploadedImage: z.any().optional(),
}).refine(data => data.imageUrl || data.uploadedImage, {
    message: "Either a photo URL or an uploaded image is required.",
    path: ["imageUrl"],
});

type Candidate = { id: string, name: string, imageUrl: string, groupId: string };
type Group = { id: string, name: string };

export default function CandidatesPage() {
  const { dict } = useDictionary();
  const { toast } = useToast();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const db = useFirestore();

  const { data: candidates, isLoading: candidatesLoading } = useCollection<Candidate>('candidates');
  const { data: groups, isLoading: groupsLoading } = useCollection<Group>('groups');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      groupId: "",
      imageUrl: "",
    },
  });

  const candidatesByGroup = useMemo(() => {
    if (!candidates || !groups) return [];
    
    return groups.map(group => ({
      ...group,
      candidates: candidates.filter(c => c.groupId === group.id)
    }));

  }, [candidates, groups]);

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
            title: dict.admin.candidates.imageRequired,
            description: dict.admin.candidates.imageRequiredDescription,
        });
        return;
    }

    const newCandidate = {
        name: values.name,
        groupId: values.groupId,
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
            <CardContent className="space-y-6">
              {candidatesLoading || groupsLoading ? (
                 <div className="space-y-4">
                    <Skeleton className="h-8 w-1/4" />
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(3)].map((_, i) => (
                            <Card key={i} className="overflow-hidden">
                                <Skeleton className="h-40 w-full" />
                                <CardHeader className="p-4">
                                    <Skeleton className="h-6 w-3/4" />
                                </CardHeader>
                                <CardFooter className="p-4 pt-0">
                                    <Skeleton className="h-9 w-full" />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                 </div>
              ) : candidatesByGroup && candidatesByGroup.length > 0 ? (
                candidatesByGroup.map(group => group.candidates.length > 0 && (
                  <div key={group.id}>
                    <h3 className="text-xl font-semibold mb-4">{group.name}</h3>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {group.candidates.map((candidate) => (
                        <Card key={candidate.id} className="overflow-hidden">
                          <div className="relative h-40 w-full bg-muted">
                            <Image 
                              src={candidate.imageUrl}
                              alt={`Portrait of ${candidate.name}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </div>
                          <CardHeader className="p-4">
                            <CardTitle className="text-lg">{candidate.name}</CardTitle>
                          </CardHeader>
                          <CardFooter className="p-4 pt-0">
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
                  </div>
                ))
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
                      name="groupId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{dict.admin.candidates.groupLabel}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={groupsLoading}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={dict.admin.candidates.groupPlaceholder} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {groups?.map(group => (
                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
