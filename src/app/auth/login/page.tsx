
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult, type Auth } from 'firebase/auth';

const setupRecaptcha = (auth: Auth) => {
    // Only configure recaptcha if not in test mode
    if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_TEST_MODE === 'true') {
        return null;
    }
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          console.log("reCAPTCHA solved");
        },
        'expired-callback': () => {
            console.log("reCAPTCHA expired");
        }
      });
    }
    return window.recaptchaVerifier;
}


export default function LoginPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const auth = getAuth();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_TEST_MODE === 'true') {
        // Mock confirmation for test mode
        const mockConfirmationResult = {
            confirm: async (code: string) => {
                if (code === '123456') {
                    return Promise.resolve({ user: { uid: `test_user_${phone}` } });
                } else {
                    return Promise.reject(new Error('Invalid test OTP'));
                }
            }
        } as unknown as ConfirmationResult;
        
        setConfirmationResult(mockConfirmationResult);
        setStep(2);
        toast({
            title: "Test Mode Active",
            description: `Enter 123456 as the OTP for ${phone}.`
        });
        setIsLoading(false);
        return;
    }
    
    const appVerifier = setupRecaptcha(auth);
    if (!appVerifier) {
         toast({
            title: "Error",
            description: "reCAPTCHA verifier not initialized. Please refresh.",
            variant: "destructive"
        });
        setIsLoading(false);
        return;
    }

    try {
        const result = await signInWithPhoneNumber(auth, phone, appVerifier);
        setConfirmationResult(result);
        setStep(2);
        toast({
            title: "OTP Sent!",
            description: `An OTP has been sent to ${phone}.`
        });
    } catch (error) {
        console.error("Error sending OTP:", error);
        toast({
            title: "Error",
            description: "Failed to send OTP. Please check the phone number or try again.",
            variant: "destructive"
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!confirmationResult) {
        toast({ title: "Error", description: "Something went wrong. Please try sending the OTP again.", variant: "destructive"});
        setIsLoading(false);
        return;
    }
    const enteredOtp = otp.join('');
    try {
        await confirmationResult.confirm(enteredOtp);
        const success = await login(phone);
        if (success) {
            toast({
                title: "Login Successful!",
                description: `Welcome back!`
            });
            router.push('/');
        } else {
             toast({
                title: "Login Failed",
                description: "User not found. Please register first.",
                variant: "destructive"
            });
             router.push('/auth/register');
        }
    } catch (error) {
         toast({
            title: "Invalid OTP",
            description: "The OTP you entered is incorrect. Please try again.",
            variant: "destructive"
        })
    } finally {
        setIsLoading(false);
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (/^[0-9]$/.test(value) || value === '') {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value !== '' && index < 5) {
        document.getElementById(`otp-input-${index + 1}`)?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      document.getElementById(`otp-input-${index - 1}`)?.focus();
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-8rem)] py-12 px-4">
      <div id="recaptcha-container"></div>
      <Card className="w-full max-w-md shadow-xl">
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Log In</CardTitle>
              <CardDescription>Enter your phone number to receive an OTP.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <>Send OTP <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
              <p className="text-xs text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/auth/register" className="font-semibold text-primary hover:underline">
                  Register
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
        {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Enter OTP</CardTitle>
                    <CardDescription>Enter the 6-digit OTP sent to {phone}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Label>OTP</Label>
                    <div className="flex justify-center gap-2 mt-2">
                        {otp.map((digit, index) => (
                        <input
                            key={index}
                            id={`otp-input-${index}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="w-12 h-14 text-center text-2xl font-bold rounded-md border bg-background text-foreground focus:ring-2 focus:ring-ring"
                            required
                        />
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                         {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify & Log In'}
                    </Button>
                    <Button variant="link" onClick={() => setStep(1)} disabled={isLoading}>
                        Back
                    </Button>
                </CardFooter>
            </form>
        )}
      </Card>
    </div>
  );
}
