'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, UserSearch } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import type { Client } from '@/lib/types';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, { message: 'الاسم يجب أن يحتوي على حرفين على الأقل.' }),
  phone: z
    .string()
    .min(10, { message: 'رقم الهاتف يجب أن يحتوي على 10 أرقام على الأقل.' })
    .regex(/^(?:\+?20)?1[0-2,5][0-9]{8}$/, { message: 'أدخل رقم هاتف مصري صالح.' }),
  total: z.coerce.number().positive({ message: 'إجمالي المبلغ يجب أن يكون رقمًا موجبًا.' }),
  months: z.coerce.number().int().positive({ message: 'عدد الشهور يجب أن يكون رقمًا صحيحًا موجبًا.' }),
  startDate: z.date({
    required_error: 'تاريخ البدء مطلوب.',
  }),
});

type ClientFormProps = {
  client?: Client;
  onFormSubmit: (data: Client) => void;
};

// Define the shape of the contact data we expect.
interface Contact {
  name?: string[];
  tel?: string[];
}

export default function ClientForm({ client, onFormSubmit }: ClientFormProps) {
  const isEditMode = !!client;
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client?.name || '',
      phone: client?.phone || '',
      total: client?.total || 0,
      months: client?.months || 1,
      startDate: client ? new Date(client.startDate) : new Date(),
    },
  });

  const handleSelectContact = async () => {
    if (!('contacts' in navigator && 'ContactsManager' in window)) {
      toast({
        variant: 'destructive',
        title: 'غير مدعوم',
        description: 'متصفحك لا يدعم ميزة اختيار جهات الاتصال.',
      });
      return;
    }

    try {
      const props: ('name' | 'tel')[] = ['name', 'tel'];
      const contacts: Contact[] = await (navigator as any).contacts.select(props, { multiple: false });

      if (contacts.length > 0) {
        const contact = contacts[0];
        const contactName = contact.name?.[0];
        let contactTel = contact.tel?.[0];

        if (contactName) {
          form.setValue('name', contactName, { shouldValidate: true });
        }

        if (contactTel) {
          // Clean up the phone number
          contactTel = contactTel.replace(/[\s-()]/g, ''); // Remove spaces, dashes, parentheses
          if (!contactTel.startsWith('20')) {
             // Basic assumption for Egyptian numbers, might need adjustment
             if (contactTel.startsWith('01')) {
                contactTel = '2' + contactTel;
             } else if (contactTel.startsWith('+20')) {
                contactTel = contactTel.substring(1);
             }
          }
          form.setValue('phone', contactTel, { shouldValidate: true });
        }

        toast({
          title: 'نجاح',
          description: 'تم استيراد بيانات جهة الاتصال.',
        });
      }
    } catch (ex) {
      // User likely cancelled the picker
      console.info('Contact picker was cancelled or failed.', ex);
    }
  };


  function onSubmit(values: z.infer<typeof formSchema>) {
    const clientData: Client = {
      id: client?.id || '', // Firestore will generate the ID, pass empty or handle in parent
      ...values,
      startDate: format(values.startDate, 'yyyy-MM-dd'),
    };
    onFormSubmit(clientData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم العميل</FormLabel>
              <FormControl>
                <Input placeholder="أحمد علي" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
               <div className="flex items-center justify-between">
                <FormLabel>رقم الهاتف</FormLabel>
                <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={handleSelectContact}>
                  <UserSearch className="me-2 h-4 w-4" />
                  اختيار من جهات الاتصال
                </Button>
              </div>
              <FormControl>
                <Input placeholder="201001234567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="total"
          render={({ field }) => (
            <FormItem>
              <FormLabel>إجمالي المبلغ</FormLabel>
              <FormControl>
                <Input type="number" placeholder="10000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="months"
          render={({ field }) => (
            <FormItem>
              <FormLabel>عدد الشهور</FormLabel>
              <FormControl>
                <Input type="number" placeholder="12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>تاريخ البدء</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full text-start font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: ar })
                      ) : (
                        <span>اختر تاريخًا</span>
                      )}
                      <CalendarIcon className="ms-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date('1990-01-01')}
                    initialFocus
                    locale={ar}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="mt-4">
          {isEditMode ? 'حفظ التعديلات' : 'إضافة عميل'}
        </Button>
      </form>
    </Form>
  );
}

    