"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signin, signup } from "@/lib/actions/auth.action";
import FormField from "./formfield";

const authFormSchema = (type: FormType) => {
  return z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(3),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const [showReset, setShowReset] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [resetLoading, setResetLoading] = React.useState(false);

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      console.log('Authform onSubmit called', { type, data });
      if (type === "sign-up") {
        const { name, email, password } = data;

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Send email verification
        if (userCredential.user) {
          try {
            console.log('Sending verification email to:', email);
            await sendEmailVerification(userCredential.user, {
              url: `${window.location.origin}/sign-in`, // Redirect URL after verification
              handleCodeInApp: false, // Use email link instead of code
            });
            toast.success("Verification email sent! Please check your inbox and verify your email before signing in.");
            console.log('Verification email sent successfully');
          } catch (error: any) {
            console.error('Email verification error:', error);
            let errorMessage = "Failed to send verification email. Please try again.";
            if (error.code === 'auth/too-many-requests') {
              errorMessage = "Too many requests. Please try again later.";
            }
            toast.error(errorMessage);
          }
        }

        const result = await signup({
          uid: userCredential.user.uid,
          name: name!,
          email,
          password,
        });

        if (!result.success) {
          toast.error(result.message);
          console.log('Sign up failed:', result.message);
          return;
        }

        // Only redirect after showing verification message
        // toast.success("Account created successfully. Please sign in.");
        console.log('Sign up success, verification email sent.');
        // router.push("/sign-in");
      } else {
        const { email, password } = data;

        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        const idToken = await userCredential.user.getIdToken();
        if (!idToken) {
          toast.error("Sign in Failed. Please try again.");
          console.log('Sign in failed: No idToken');
          return;
        }

        await signin({
          email,
          idToken,
        });

        toast.success("Signed in successfully.");
        console.log('Sign in success, redirecting to /');
        router.push("/");
      }
    } catch (error) {
      console.log('Authform onSubmit error:', error);
      toast.error(`There was an error: ${error}`);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    setResetLoading(true);
    try {
      console.log('Sending password reset email to:', resetEmail);
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Password reset email sent! Please check your inbox.");
      setShowReset(false);
      setResetEmail("");
    } catch (error: any) {
      console.error('Password reset error:', error);
      let errorMessage = "Failed to send password reset email. Please try again.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many requests. Please try again later.";
      }
      toast.error(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const issignin = type === "sign-in";

  return (
    <div className="lg:min-w-[566px] bg-black/10 backdrop-blur-md border border-green-400/20 rounded-xl shadow-lg shadow-green-400/10 transform transition duration-300 hover:shadow-2xl hover:shadow-green-500/30 hover:scale-105 hover:-translate-y-2">
      <div className="flex flex-col gap-6 py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-green-200 text-2xl font-semibold animate-pulse">EzzHire</h2>
        </div>

        <h3 className="text-center text-white">
          Practice job interview with AI on{" "}
          <span className="text-green-400 font-medium">EzzHire</span>
        </h3>

        {showReset ? (
          <form onSubmit={handlePasswordReset} className="w-full space-y-6 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="resetEmail" className="text-white">Email</Label>
              <Input
                id="resetEmail"
                type="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="bg-black/20 border-green-400/20 text-white placeholder:text-gray-400"
                required
              />
            </div>
            <Button
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition"
              type="submit"
              disabled={resetLoading}
            >
              {resetLoading ? "Sending..." : "Send Password Reset Email"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-gray-300 hover:text-white"
              onClick={() => setShowReset(false)}
            >
              Back to Sign In
            </Button>
          </form>
        ) : (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6 mt-4">
                {!issignin && (
                  <FormField
                    control={form.control}
                    name="name"
                    label="Name"
                    placeholder="Enter your name"
                    type="text"
                  />
                )}
                <FormField
                  control={form.control}
                  name="email"
                  label="Email"
                  placeholder="you@example.com"
                  type="email"
                />
                <FormField
                  control={form.control}
                  name="password"
                  label=" Password"
                  placeholder="********"
                  type="password"
                />
                <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition"
                  type="submit"
                >
                  {!issignin ? "Create an Account on EzzHire" : "Sign In"}
                </Button>
              </form>
            </Form>
            {issignin && (
              <button
                className="text-green-400 font-semibold mt-2 hover:underline text-sm"
                type="button"
                onClick={() => setShowReset(true)}
              >
                Forgot Password?
              </button>
            )}
          </>
        )}
        <p className="text-center text-sm text-gray-300 mt-6">
          {issignin ? "No account yet?" : "Have an account already?"}
          <Link
            href={issignin ? "/sign-up" : "/sign-in"}
            className="text-green-400 font-semibold ml-1 hover:underline"
          >
            {!issignin ? "Sign In" : "Sign Up"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
