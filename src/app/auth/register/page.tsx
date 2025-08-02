
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { ArrowRight, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';


export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [referralCode, setReferralCode] = useState('');
  const [drawId, setDrawId] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { register } = useAuth();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }
    const dId = searchParams.get('drawId');
    if (dId) {
      setDrawId(dId);
    }
  }, [searchParams]);


  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would use Firebase to send an OTP
    toast({
        title: "OTP Sent!",
        description: `An OTP has been sent to ${phone}. (Hint: It's 123456)`
    })
    setStep(2);
  };
  
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if(otp.join('') === '123456') {
        const result = await register(phone, name, referralCode, drawId);
        if (result.success) {
            toast({
                title: "Registration Successful!",
                description: `Welcome to Lucky Six, ${name}! ${result.message || ''}`
            });
            router.push('/');
        } else {
            toast({
                title: "Registration Failed",
                description: result.message || "An unknown error occurred.",
                variant: "destructive"
            });
        }
    } else {
        toast({
            title: "Invalid OTP",
            description: "The OTP you entered is incorrect. Please try again.",
            variant: "destructive"
        })
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
      <Card className="w-full max-w-md shadow-xl">
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
              <CardDescription>Enter your details to start winning.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
               <div className="space-y-2">
                <Label htmlFor="referral">Referral Code (from link)</Label>
                <Input id="referral" type="text" placeholder="Auto-filled from referral link" value={referralCode} onChange={e => setReferralCode(e.target.value)} disabled={!!searchParams.get('ref')} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Send OTP <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                  Log In
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
        {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Verify Your Phone</CardTitle>
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
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        Verify & Register
                    </Button>
                    <Button variant="link" onClick={() => setStep(1)}>
                        Back
                    </Button>
                </CardFooter>
            </form>
        )}
      </Card>
    </div>
  );
}
