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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useDictionary } from "@/hooks/use-dictionary";
import { PlusCircle, Trash2, User, Upload, Layers, Search } from "lucide-react";
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
  groupId: z.string().min(1, "An election group must be selected."),
  imageUrl: z.string().optional(),
  uploadedImage: z.any().optional(),
}).refine(data => data.imageUrl || data.uploadedImage, {
    message: "Either a photo URL or an uploaded image is required.",
    path: ["imageUrl"],
});

type Candidate = { id: string, name: string, description: string, imageUrl: string, groupId: string };
type Group = { id: string, name: string };

export default function CandidatesPage() {
  const { dict } = useDictionary();
  const { toast } = useToast();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const db = useFirestore();

  const { data: candidates, isLoading: candidatesLoading } = useCollection<Candidate>("candidates");
  const { data: groups, isLoading: groupsLoading } = useCollection<Group>('groups');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      groupId: "",
      imageUrl: "",
    },
  });

  const filteredCandidates = useMemo(() => {
    return candidates
      ?.filter(c => selectedGroupFilter === 'all' || c.groupId === selectedGroupFilter)
      .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [candidates, selectedGroupFilter, searchTerm]);


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
    setPreviewImage(url);
    if (url) {
        form.setValue("uploadedImage", null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        form.clearErrors("imageUrl");
    }
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
        groupId: values.groupId,
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

  const renderCandidateList = () => {
    const isLoading = candidatesLoading || groupsLoading;

    if (isLoading) {
      return (
         <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="ml-4 space-y-2">
                        <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="ml-auto h-8 w-20" />
                </div>
            ))}
        </div>
      );
    }
    
    if (filteredCandidates && filteredCandidates.length > 0) {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dict.admin.candidates.nameLabel}</TableHead>
              <TableHead>{dict.admin.groups.title}</TableHead>
              <TableHead className="text-right">{dict.admin.candidates.removeButton}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.map((candidate) => {
              const group = groups?.find(g => g.id === candidate.groupId);
              return (
                <TableRow key={candidate.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={candidate.imageUrl} alt={candidate.name} />
                        <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{candidate.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{group?.name || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeCandidate(candidate)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      );
    }
    
    return (
      <div className="text-center py-10 border-2 border-dashed rounded-lg">
        <User className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">
          {dict.admin.candidates.noCandidates}
        </p>
      </div>
    );
  };


  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{dict.admin.candidates.title}</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder={dict.admin.history.searchPlaceholder.split('...')[0]}
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={selectedGroupFilter} onValueChange={setSelectedGroupFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder={dict.admin.candidates.groupSelectPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Groups</SelectItem>
                            {groups?.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
              {renderCandidateList()}
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
                        <FormLabel>{dict.admin.candidates.groupSelectLabel}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={groupsLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={dict.admin.candidates.groupSelectPlaceholder} />
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
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-muted cursor-pointer hover:bg-muted/80">
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
