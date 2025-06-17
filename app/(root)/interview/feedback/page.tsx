"use client"
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

interface Feedback {
  totalScore: number;
  finalAssessment: string;
  // Add more fields if your feedback object contains more properties
}

const FeedbackPage = () => {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("interviewId");

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      const res = await fetch(`/api/interview/${interviewId}/feedback`);
      const data = await res.json();
      setFeedback(data.feedback);
      setLoading(false);
    };
    if (interviewId) fetchFeedback();
  }, [interviewId]);

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-green-950 rounded-xl shadow-lg text-white">
      {loading ? (
        <div>Generating your feedback...</div>
      ) : feedback ? (
        <>
          <h2 className="text-2xl font-bold mb-4">Your Interview Feedback</h2>
          <div className="mb-4">
            <div className="font-semibold">Total Score: {feedback.totalScore}/100</div>
            <div className="mt-2">{feedback.finalAssessment}</div>
          </div>
          <Button className="bg-green-500 hover:bg-green-600" onClick={() => router.push(`/interview/${interviewId}/results`)}>
            View Results
          </Button>
        </>
      ) : (
        <div>No feedback found for this interview.</div>
      )}
    </div>
  );
};

export default FeedbackPage; 