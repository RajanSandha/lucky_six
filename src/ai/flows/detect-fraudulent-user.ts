'use server';

/**
 * @fileOverview A user fraud detection AI agent.
 *
 * - detectFraudulentUser - A function that handles the user fraud detection process.
 * - DetectFraudulentUserInput - The input type for the detectFraudulentUser function.
 * - DetectFraudulentUserOutput - The return type for the detectFraudulentUser function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectFraudulentUserInputSchema = z.object({
  userName: z.string().describe('The name of the user.'),
  phoneNumber: z.string().describe('The phone number of the user.'),
  registrationIp: z.string().describe('The IP address used during registration.'),
  registrationDate: z.string().describe('The date and time of registration.'),
  ticketPurchaseHistory: z.string().describe('The history of ticket purchases by the user.'),
  otpVerificationSuccessRate: z.number().describe('The success rate of OTP verifications for the user.'),
});
export type DetectFraudulentUserInput = z.infer<typeof DetectFraudulentUserInputSchema>;

const DetectFraudulentUserOutputSchema = z.object({
  isFraudulent: z.boolean().describe('Whether or not the user is potentially fraudulent.'),
  fraudReason: z.string().describe('The reason why the user is flagged as potentially fraudulent.'),
  confidenceScore: z.number().describe('A score indicating the confidence level of the fraud detection.'),
});
export type DetectFraudulentUserOutput = z.infer<typeof DetectFraudulentUserOutputSchema>;

export async function detectFraudulentUser(input: DetectFraudulentUserInput): Promise<DetectFraudulentUserOutput> {
  return detectFraudulentUserFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectFraudulentUserPrompt',
  input: {schema: DetectFraudulentUserInputSchema},
  output: {schema: DetectFraudulentUserOutputSchema},
  prompt: `You are an expert in detecting fraudulent user accounts in a prize draw system.

You will use the provided information to assess the likelihood of a user being fraudulent.

Consider factors such as registration patterns, purchase history, and OTP verification success rate.

Based on your analysis, determine whether the user is potentially fraudulent and provide a reason for your assessment.

User Name: {{{userName}}}
Phone Number: {{{phoneNumber}}}
Registration IP: {{{registrationIp}}}
Registration Date: {{{registrationDate}}}
Ticket Purchase History: {{{ticketPurchaseHistory}}}
OTP Verification Success Rate: {{{otpVerificationSuccessRate}}}

Set the isFraudulent field to true if you suspect fraudulent activity, and provide a detailed fraudReason.
Also, provide a confidenceScore (0-1) indicating the certainty of your assessment.
`,
});

const detectFraudulentUserFlow = ai.defineFlow(
  {
    name: 'detectFraudulentUserFlow',
    inputSchema: DetectFraudulentUserInputSchema,
    outputSchema: DetectFraudulentUserOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
