import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { dummyInterviews } from "@/constants";
import InterviewCard from "@/components/InterviewCard";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page: React.FC = async () => {
  const user = await getCurrentUser();
  return (
    <>
      {/* Credits Section */}
      <section className="w-full flex items-center justify-between gap-6 p-4 mb-10">
        <div className="flex items-center gap-4">
          <Image src="/star.svg" alt="Credits" width={40} height={40} />
          <span className="text-3xl font-extrabold text-white drop-shadow-lg">
            {user?.credits ?? 0} <span className="text-green-900">Credits</span>
          </span>
        </div>
        <Button className="bg-white text-green-700 font-bold px-6 py-3 rounded-lg shadow hover:bg-green-100 transition" asChild>
          <Link href="/buy-credits">Buy Credits</Link>
        </Button>
      </section>
      {/* Hero Section */}
      <section className="w-full flex flex-col md:flex-row items-center justify-between gap-10 p-12 rounded-2xl border-2 border-green-400 mb-10 bg-transparent">
        <div className="flex flex-col gap-8 max-w-xl text-white">
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight drop-shadow-lg">
            Ace your Interviews with <br />
            <span className="text-green-300">AI-Powered Practice & Feedback</span>
          </h2>
          <p className="text-xl text-white/90 font-medium">
            Practice real interview questions with instant feedback and smart analysis. Get ready for your dream job with confidence!
          </p>
          <Button asChild className="bg-green-400 hover:bg-green-500 text-green-900 font-bold px-8 py-4 rounded-xl shadow-lg max-sm:w-full transition-all duration-200">
            <Link href="/interview">Start your Interview</Link>
          </Button>
        </div>
        <div className="transition-transform duration-700 hover:rotate-[360deg]">
          <Image src="/robot.png" alt="AI Interview Bot" height={420} width={420} className="rounded-2xl shadow-2xl" />
        </div>
      </section>
      {/* Your Interviews Section */}
      <section className="flex flex-col gap-6 mt-8">
        <h2 className="text-2xl font-semibold text-white">Your Interviews</h2>
        <div className="interviews-section grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dummyInterviews.length > 0 ? (
            dummyInterviews.map((interview) => (
              <InterviewCard key={interview.id} interviewId={interview.id} {...interview} />
            ))
          ) : (
            <p className="text-white/80">You have not taken any interview yet.</p>
          )}
        </div>
      </section>
      {/* Take an Interview Section */}
      <section className="flex flex-col gap-6 mt-8">
        <h2 className="text-2xl font-semibold text-white">Take an Interview</h2>
        <div className="interviews-section grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dummyInterviews.map((interview) => (
            <InterviewCard key={interview.id} interviewId={interview.id} {...interview} />
          ))}
        </div>
      </section>
    </>
  );
};

export default Page;
