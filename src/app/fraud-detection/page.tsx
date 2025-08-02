
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { handleFraudCheck } from "./actions";
import type { DetectFraudulentUserInput, DetectFraudulentUserOutput } from "@/ai/flows/detect-fraudulent-user";
import { Progress } from "@/components/ui/progress";

const FormSchema = z.object({
  userName: z.string().min(1, "User name is required"),
  phoneNumber: z.string().min(10, "A valid phone number is required"),
  registrationIp: z.string().ip({ version: "v4", message: "Invalid IP address" }),
  registrationDate: z.string().min(1, "Registration date is required"),
  ticketPurchaseHistory: z.string().min(1, "Purchase history is required"),
  otpVerificationSuccessRate: z.coerce.number().min(0).max(1, "Rate must be between 0 and 1"),
});

export default function FraudDetectionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DetectFraudulentUserOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<DetectFraudulentUserInput>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      userName: "Suspicious User",
      phoneNumber: "+911234567890",
      registrationIp: "192.168.1.10",
      registrationDate: new Date().toISOString(),
      ticketPurchaseHistory: "Buys 10 tickets exactly 5 minutes before every draw closes.",
      otpVerificationSuccessRate: 0.2,
    },
  });

  const onSubmit: SubmitHandler<DetectFraudulentUserInput> = async (data) => {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await handleFraudCheck(data);
      setResult(res);
    } catch (error) {
      toast({
        title: "An error occurred.",
        description: "Failed to run fraud detection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
          Fraud Detection Center
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Use our AI-powered tool to check for potentially fraudulent users.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">User Data Input</CardTitle>
            <CardDescription>Enter the user's details for analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="userName">User Name</Label>
                <Input id="userName" {...form.register("userName")} />
                {form.formState.errors.userName && <p className="text-sm text-destructive mt-1">{form.formState.errors.userName.message}</p>}
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" {...form.register("phoneNumber")} />
                {form.formState.errors.phoneNumber && <p className="text-sm text-destructive mt-1">{form.formState.errors.phoneNumber.message}</p>}
              </div>
              <div>
                <Label htmlFor="registrationIp">Registration IP</Label>
                <Input id="registrationIp" {...form.register("registrationIp")} />
                 {form.formState.errors.registrationIp && <p className="text-sm text-destructive mt-1">{form.formState.errors.registrationIp.message}</p>}
              </div>
              <div>
                <Label htmlFor="otpVerificationSuccessRate">OTP Success Rate (0-1)</Label>
                <Input id="otpVerificationSuccessRate" type="number" step="0.1" {...form.register("otpVerificationSuccessRate")} />
                {form.formState.errors.otpVerificationSuccessRate && <p className="text-sm text-destructive mt-1">{form.formState.errors.otpVerificationSuccessRate.message}</p>}
              </div>
              <div>
                <Label htmlFor="ticketPurchaseHistory">Ticket Purchase History</Label>
                <Textarea id="ticketPurchaseHistory" {...form.register("ticketPurchaseHistory")} />
                {form.formState.errors.ticketPurchaseHistory && <p className="text-sm text-destructive mt-1">{form.formState.errors.ticketPurchaseHistory.message}</p>}
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Analyze User
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Analysis Result</CardTitle>
            <CardDescription>The AI's assessment will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p>AI is analyzing... Please wait.</p>
              </div>
            )}
            {result && (
              <div className="space-y-6">
                <div className={`p-4 rounded-lg flex items-center gap-4 ${result.isFraudulent ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
                  {result.isFraudulent ? <ShieldAlert className="h-10 w-10 text-destructive"/> : <ShieldCheck className="h-10 w-10 text-green-500"/>}
                  <div>
                    <h3 className={`text-xl font-bold font-headline ${result.isFraudulent ? 'text-destructive' : 'text-green-600'}`}>
                      {result.isFraudulent ? 'Potentially Fraudulent' : 'Likely Not Fraudulent'}
                    </h3>
                  </div>
                </div>
                 <div>
                    <Label>Confidence Score: {Math.round(result.confidenceScore * 100)}%</Label>
                    <Progress value={result.confidenceScore * 100} className="w-full h-3 mt-1 [&>div]:bg-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">Reasoning:</h4>
                  <p className="text-muted-foreground text-sm mt-1 p-3 bg-muted/50 rounded-md">{result.fraudReason}</p>
                </div>
              </div>
            )}
            {!isLoading && !result && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Submit user data to see the analysis.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
