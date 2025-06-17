"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

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

        toast.success("Account created successfully. Please sign in.");
        console.log('Sign up success, redirecting to /sign-in');
        router.push("/sign-in");
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
