"use server";

import { detectFraudulentUser, type DetectFraudulentUserInput, type DetectFraudulentUserOutput } from "@/ai/flows/detect-fraudulent-user";

export async function handleFraudCheck(input: DetectFraudulentUserInput): Promise<DetectFraudulentUserOutput> {
  try {
    const result = await detectFraudulentUser(input);
    return result;
  } catch (error) {
    console.error("Error in fraud detection flow:", error);
    throw new Error("Failed to get a response from the AI model.");
  }
}
