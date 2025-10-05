'use server';

/**
 * @fileOverview Generates summary reports using generative AI for insights on total receivables, paid amounts, and outstanding balances.
 *
 * - generateSummaryReport - A function that generates a summary report.
 * - GenerateSummaryReportInput - The input type for the generateSummaryReport function.
 * - GenerateSummaryReportOutput - The return type for the generateSummaryReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSummaryReportInputSchema = z.object({
  totalReceivables: z.number().describe('The total amount of money expected from all clients.'),
  totalPaid: z.number().describe('The total amount of money already paid by all clients.'),
  totalOutstanding: z.number().describe('The total remaining balance to be collected.'),
  clients: z.array(
    z.object({
      name: z.string(),
      total: z.number(),
      paid: z.number(),
      remaining: z.number(),
      status: z.string().describe("The client's payment status (e.g., 'Late', 'Paid', 'On-track')."),
    })
  ).describe('An array of client financial summaries.'),
});
export type GenerateSummaryReportInput = z.infer<typeof GenerateSummaryReportInputSchema>;

const GenerateSummaryReportOutputSchema = z.object({
  report: z.string().describe('A detailed financial analysis report with insights and recommendations, in Arabic.'),
});
export type GenerateSummaryReportOutput = z.infer<typeof GenerateSummaryReportOutputSchema>;

export async function generateSummaryReport(input: GenerateSummaryReportInput): Promise<GenerateSummaryReportOutput> {
  return generateSummaryReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSummaryReportPrompt',
  input: {schema: GenerateSummaryReportInputSchema},
  output: {schema: GenerateSummaryReportOutputSchema},
  prompt: `
  You are an expert financial analyst AI. Your task is to provide a smart, insightful financial report in Arabic based on the following data.

  The report must be concise, easy to read, and provide actionable insights.

  Data Overview:
  - Total Receivables: {{{totalReceivables}}}
  - Total Paid: {{{totalPaid}}}
  - Total Outstanding: {{{totalOutstanding}}}
  - Number of Clients: {{clients.length}}

  Client Details:
  {{#each clients}}
  - Client: {{name}}, Status: {{status}}, Remaining: {{remaining}}
  {{/each}}

  Your report should include the following sections:
  1.  **ملخص عام (Overall Summary):** Start with a brief, high-level summary of the financial situation. Mention the percentage of collected funds.
  2.  **رؤى رئيسية (Key Insights):**
      - Identify the top 2-3 clients with the highest outstanding balances.
      - Identify the number of clients who are late on their payments (status 'متأخر').
      - Mention any positive trends, like clients who have fully paid off their debts (status 'مدفوع').
  3.  **توصيات (Recommendations):**
      - Based on the insights, provide 1-2 concrete, actionable recommendations. For example, suggest focusing on collecting from late clients to improve cash flow.
      - Keep the tone encouraging and professional.

  Generate the final report in a single block of text using markdown for formatting (like bolding and lists).
  `,
});

const generateSummaryReportFlow = ai.defineFlow(
  {
    name: 'generateSummaryReportFlow',
    inputSchema: GenerateSummaryReportInputSchema,
    outputSchema: GenerateSummaryReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
