'use server';

/**
 * @fileOverview Automatically generates WhatsApp messages with payment details for clients.
 *
 * - generateWhatsAppMessage - A function that generates the WhatsApp message.
 * - WhatsAppMessageInput - The input type for the generateWhatsAppMessage function.
 * - WhatsAppMessageOutput - The return type for the generateWhatsAppMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WhatsAppMessageInputSchema = z.object({
  name: z.string().describe('The name of the client.'),
  phone: z.string().describe('The phone number of the client.'),
  total: z.number().describe('The total amount owed by the client.'),
  paid: z.number().describe('The amount paid by the client.'),
  remaining: z.number().describe('The remaining amount owed by the client.'),
  months: z.number().describe('The number of months for the payment plan.'),
  startDate: z.string().describe('The start date of the payment plan (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date of the payment plan (YYYY-MM-DD).'),
});
export type WhatsAppMessageInput = z.infer<typeof WhatsAppMessageInputSchema>;

const WhatsAppMessageOutputSchema = z.object({
  message: z.string().describe('The generated WhatsApp message.'),
});
export type WhatsAppMessageOutput = z.infer<typeof WhatsAppMessageOutputSchema>;

export async function generateWhatsAppMessage(input: WhatsAppMessageInput): Promise<WhatsAppMessageOutput> {
  return generateWhatsAppMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWhatsAppMessagePrompt',
  input: {schema: WhatsAppMessageInputSchema},
  output: {schema: WhatsAppMessageOutputSchema},
  prompt: `
  You are an assistant creating a friendly payment reminder for a client in Arabic.

  Client Name: {{{name}}}
  Remaining Amount: {{{remaining}}}
  
  Instructions:
  1.  Start with a friendly greeting: "مرحبًا {{{name}}}،"
  2.  Write a simple and polite sentence to remind the client of their outstanding payment.
  3.  Clearly state the remaining amount.
  4.  End with a polite closing, like "شكرًا لتعاونكم."
  5.  The entire message should be short, friendly, and professional. Do not add any extra information.
  
  Example Output:
  "مرحبًا {{{name}}}، نود تذكيركم بوجود دفعة مستحقة. المبلغ المتبقي هو {{{remaining}}} جنيه. شكرًا لتعاونكم."
  `,
});

const generateWhatsAppMessageFlow = ai.defineFlow(
  {
    name: 'generateWhatsAppMessageFlow',
    inputSchema: WhatsAppMessageInputSchema,
    outputSchema: WhatsAppMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
