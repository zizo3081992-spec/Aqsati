'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const profileSchema = z.object({
  displayName: z.string().min(2, { message: 'الاسم يجب أن يحتوي على حرفين على الأقل.' }).max(50),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(6, { message: 'كلمة المرور الحالية مطلوبة.' }),
    newPassword: z.string().min(6, { message: 'كلمة المرور الجديدة يجب أن تحتوي على 6 أحرف على الأقل.' }),
    confirmPassword: z.string().min(6, { message: 'تأكيد كلمة المرور مطلوب.' }),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: 'كلمتا المرور الجديدتان غير متطابقتين.',
    path: ['confirmPassword'],
});

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        profileForm.setValue('displayName', user.displayName || '');
      } else {
        router.push('/login');
      }
    }
  }, [user, isUserLoading, router, profileForm]);

  async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) return;
    setIsProfileUpdating(true);
    try {
      await updateProfile(user, { displayName: values.displayName });
      toast({
        title: 'نجاح',
        description: 'تم تحديث اسمك بنجاح.',
      });
    } catch (error) {
        console.error("Error updating profile:", error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل تحديث الملف الشخصي. حاول مرة أخرى.',
      });
    } finally {
      setIsProfileUpdating(false);
    }
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    if (!user || !user.email) return;
    setIsPasswordUpdating(true);
    
    try {
      const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
      // Re-authenticate the user before changing the password
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, values.newPassword);
      
      toast({
        title: 'نجاح',
        description: 'تم تغيير كلمة المرور بنجاح.',
      });
      passwordForm.reset();
    } catch (error: any) {
        console.error("Error updating password:", error);
        let description = 'فشل تغيير كلمة المرور. حاول مرة أخرى.';
        if (error.code === 'auth/wrong-password') {
            description = 'كلمة المرور الحالية غير صحيحة. يرجى التأكد والمحاولة مرة أخرى.';
        }
        toast({
            variant: 'destructive',
            title: 'خطأ',
            description: description,
        });
    } finally {
      setIsPasswordUpdating(false);
    }
  }

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <Button asChild variant="ghost" size="icon" className="me-4">
            <Link href="/">
                <ArrowLeft className="h-5 w-5" />
            </Link>
        </Button>
        <h1 className="font-headline text-2xl font-bold text-foreground">الملف الشخصي</h1>
       </header>
        <main className="flex flex-1 justify-center gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="w-full max-w-2xl grid gap-6">
                <Card>
                    <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                            <AvatarFallback className="text-2xl">👤</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl">{user.displayName || 'مستخدم'}</CardTitle>
                            <CardDescription>{user.email}</CardDescription>
                        </div>
                    </div>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>تعديل بيانات الحساب</CardTitle>
                        <CardDescription>قم بتحديث اسم العرض الخاص بك هنا.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                            <FormField
                            control={profileForm.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>اسم العرض</FormLabel>
                                <FormControl>
                                    <Input placeholder="أدخل اسمك" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <Button type="submit" disabled={isProfileUpdating}>
                                {isProfileUpdating && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                                حفظ التغييرات
                            </Button>
                        </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>تغيير كلمة المرور</CardTitle>
                        <CardDescription>لأمان حسابك، يجب إعادة المصادقة لتغيير كلمة المرور.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="currentPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>كلمة المرور الحالية</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>كلمة المرور الجديدة</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={passwordForm.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>تأكيد كلمة المرور الجديدة</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isPasswordUpdating}>
                                    {isPasswordUpdating && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                                    تغيير كلمة المرور
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </main>
    </div>
  );
}
