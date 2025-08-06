'use server';

/**
 * @fileOverview Summarizes user feedback related to the prize draw.
 *
 * - summarizeUserFeedback - A function that summarizes user feedback.
 * - SummarizeUserFeedbackInput - The input type for the summarizeUserFeedback function.
 * - SummarizeUserFeedbackOutput - The return type for the summarizeUserFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeUserFeedbackInputSchema = z.object({
  feedback: z
    .string()
    .describe('The user feedback to summarize.'),
});
export type SummarizeUserFeedbackInput = z.infer<typeof SummarizeUserFeedbackInputSchema>;

const SummarizeUserFeedbackOutputSchema = z.object({
  summary: z.string().describe('The summary of the user feedback.'),
});
export type SummarizeUserFeedbackOutput = z.infer<typeof SummarizeUserFeedbackOutputSchema>;

export async function summarizeUserFeedback(input: SummarizeUserFeedbackInput): Promise<SummarizeUserFeedbackOutput> {
  return summarizeUserFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeUserFeedbackPrompt',
  input: {schema: SummarizeUserFeedbackInputSchema},
  output: {schema: SummarizeUserFeedbackOutputSchema},
  prompt: `Summarize the following user feedback about the prize draw:

{{{feedback}}}`,
});

const summarizeUserFeedbackFlow = ai.defineFlow(
  {
    name: 'summarizeUserFeedbackFlow',
    inputSchema: SummarizeUserFeedbackInputSchema,
    outputSchema: SummarizeUserFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
