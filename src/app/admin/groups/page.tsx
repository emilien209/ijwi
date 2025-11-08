
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
import { PlusCircle, Trash2, Group as GroupIcon } from "lucide-react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, deleteDoc, doc } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, "Group name is required."),
  description: z.string().optional(),
});

type Group = { id: string; name: string; description?: string };

export default function GroupsPage() {
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
    const newGroup = {
        name: values.name,
        description: values.description || "",
    };

    const groupsCol = collection(db, 'groups');
    
    addDoc(groupsCol, newGroup)
        .then(() => {
            toast({
              title: "Group Added",
              description: `Group "${values.name}" has been created.`,
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
              title: "Group Removed", 
              description: `Group "${group.name}" has been removed.`, 
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
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Election Groups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupsLoading ? (
                 <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="p-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <Skeleton className="h-6 w-32 mb-2" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                                <Skeleton className="h-9 w-24" />
                            </div>
                        </Card>
                    ))}
                 </div>
              ) : groups && groups.length > 0 ? (
                <div className="space-y-4">
                  {groups.map((group) => (
                    <Card key={group.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                           <div>
                             <CardTitle className="text-lg">{group.name}</CardTitle>
                             {group.description && <CardDescription>{group.description}</CardDescription>}
                           </div>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => removeGroup(group)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> 
                              Remove
                            </Button>
                        </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <GroupIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">
                    No election groups created yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add Election Group</CardTitle>
               <CardDescription>Create a new category for candidates, like "Presidential" or "Parliamentary".</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Presidential Election" 
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
                        <FormLabel>Group Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Candidates for the 2024 presidential race." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Add Group
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

    