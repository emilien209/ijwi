
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound } from 'lucide-react';
import { useDictionary } from '@/hooks/use-dictionary';

const formSchema = z.object({
  password: z.string().min(1, 'Password is required.'),
});

const ADMIN_PASSWORD = 'onerwanda';
export const ADMIN_AUTH_TOKEN = 'admin-auth-token';


export default function AdminAuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { dict } = useDictionary();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (sessionStorage.getItem(ADMIN_AUTH_TOKEN)) {
      router.replace('/admin');
    }
  }, [router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setTimeout(() => {
      if (values.password === ADMIN_PASSWORD) {
        sessionStorage.setItem(ADMIN_AUTH_TOKEN, 'true');
        toast({
          title: dict.admin.auth.successTitle,
          description: dict.admin.auth.successDescription,
        });
        router.replace('/admin');
      } else {
        toast({
          variant: 'destructive',
          title: dict.admin.auth.errorTitle,
          description: dict.admin.auth.errorDescription,
        });
        setIsLoading(false);
      }
    }, 1000);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">{dict.admin.auth.title}</CardTitle>
              <CardDescription>
                {dict.admin.auth.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{dict.admin.auth.passwordLabel}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={dict.admin.auth.passwordPlaceholder}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardContent>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    <span>{dict.admin.auth.unlockingButton}</span>
                  </>
                ) : (
                  dict.admin.auth.unlockButton
                )}
              </Button>
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  );
}
