
"use client";

import { useAuth } from '@/context/AuthContext';
import { notFound, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Share2, Gift } from 'lucide-react';

export default function ReferralPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    if (loading) {
        return null; // Or a loading spinner
    }

    if (!user) {
        router.push('/auth/login');
        return null;
    }

    const referralLink = `${window.location.origin}/auth/register?ref=${user.referralCode}`;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to Clipboard!",
            description: "You can now share it with your friends.",
        });
    }

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="text-center mb-12">
                <Gift className="h-16 w-16 mx-auto text-primary mb-4" />
                <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
                    Refer & Earn
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                    Share the excitement of Lucky Six and get rewarded!
                </p>
            </div>

            <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Your Referral Code</CardTitle>
                        <CardDescription>Share this code with your friends.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Input value={user.referralCode || 'N/A'} readOnly className="font-mono text-lg" />
                            <Button variant="outline" size="icon" onClick={() => copyToClipboard(user.referralCode || '')}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Your Referral Link</CardTitle>
                        <CardDescription>Or share this direct link.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                             <Input value={referralLink} readOnly />
                            <Button variant="outline" size="icon" onClick={() => copyToClipboard(referralLink)}>
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="max-w-2xl mx-auto mt-8 bg-muted/50">
                <CardHeader>
                    <CardTitle className="font-headline">How it Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>Share your unique code or link with a friend.</li>
                        <li>Your friend registers for Lucky Six using your code.</li>
                        <li>Once they register successfully, you **both** receive a free ticket for an active referral-enabled draw!</li>
                        <li>You can refer up to 5 friends per draw. Keep an eye on active draws to maximize your rewards.</li>
                    </ol>
                </CardContent>
            </Card>

        </div>
    )
}
