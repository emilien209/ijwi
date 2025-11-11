
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { PlusCircle, Trash2, Layers } from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, "Group name is required."),
  description: z.string().min(10, "A short description is required."),
});

type Group = { id: string, name: string, description: string };

export default function GroupsPage() {
  const { dict } = useDictionary();
  const { toast } = useToast();
  const db = useFirestore();

  const { data: groups, isLoading: groupsLoading } = useCollection<Group>('groups');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!db) return;

    const newGroup = {
        name: values.name,
        description: values.description,
    };

    const groupsCol = collection(db, 'groups');
    
    addDoc(groupsCol, newGroup)
        .then(() => {
            toast({
              title: dict.appName,
              description: dict.admin.groups.addSuccess.replace('{groupName}', values.name),
            });
            form.reset();
        })
        .catch(serverError => {
             const permissionError = new FirestorePermissionError({
                path: groupsCol.path,
                operation: 'create',
                requestResourceData: newGroup,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  }

  const removeGroup = (group: Group) => {
    if (!db) return;
    const docRef = doc(db, 'groups', group.id);
    deleteDoc(docRef)
        .then(() => {
             toast({ 
              title: dict.appName,
              description: dict.admin.groups.removeSuccess.replace('{groupName}', group.name),
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
              <CardTitle>{dict.admin.groups.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {groupsLoading ? (
                 <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                        <Card key={i} className="overflow-hidden p-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-4 w-64" />
                                </div>
                                <Skeleton className="h-9 w-24" />
                            </div>
                        </Card>
                    ))}
                 </div>
              ) : groups && groups.length > 0 ? (
                <div className="space-y-4">
                  {groups.map((group) => (
                    <Card key={group.id} className="overflow-hidden">
                      <div className="p-6 flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl">{group.name}</CardTitle>
                            <CardDescription className="mt-2 text-sm">
                                {group.description}
                            </CardDescription>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => removeGroup(group)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> 
                          {dict.admin.groups.removeButton}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">
                    {dict.admin.groups.noGroups}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{dict.admin.groups.addTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{dict.admin.groups.nameLabel}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={dict.admin.groups.namePlaceholder} 
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
                        <FormLabel>{dict.admin.groups.descriptionLabel}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={dict.admin.groups.descriptionPlaceholder}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    {dict.admin.groups.addButton}
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

