"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  type = 'generate',
  level = '',
  interviewType = '',
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [startLoading, setStartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.log("Error:", error);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async () => {
      setFeedbackLoading(true);
      if (!interviewId || !userId) {
        setError('Interview ID or User ID is missing. Cannot generate feedback.');
        setFeedbackLoading(false);
        return;
      }
      console.log('Creating feedback with:', { interviewId, userId, transcript: messages, type: interviewType, level });
      const result = await createFeedback({
        interviewId,
        userId,
        transcript: messages,
        type: interviewType,
        level,
      });
      setFeedbackLoading(false);
      if (!result || !result.success) {
        setError('Failed to generate feedback. Please try again.');
        return;
      }
      router.push(`/interview/feedback?interviewId=${interviewId}`);
    };

    if (callStatus === CallStatus.FINISHED) {
      handleGenerateFeedback();
    }
  }, [messages, callStatus, interviewId, router, userId, type, level]);

  const handleCall = async () => {
    setError(null);
    setStartLoading(true);
    // Check and deduct credits before starting interview
    try {
      const res = await fetch("/api/interview/start", { method: "POST" });
      if (res.status === 402) {
        router.push("/buy-credits");
        return;
      }
      if (!res.ok) {
        setError("Failed to start interview. Please try again.");
        setStartLoading(false);
        return;
      }
    } catch {
      setError("Failed to start interview. Please try again.");
      setStartLoading(false);
      return;
    }
    setStartLoading(false);
    setCallStatus(CallStatus.CONNECTING);

    if (type === "generate") {
      await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
        variableValues: {
          username: userName,
          userid: userId,
        },
      });
    } else {
      let formattedQuestions = "";
      if (questions) {
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join("\n");
      }

      await vapi.start(interviewer, {
        variableValues: {
          questions: formattedQuestions,
        },
      });
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/inter.gif"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/rtr.png"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button className="relative btn-call" onClick={() => handleCall()} disabled={startLoading || feedbackLoading}>
            {startLoading ? "Starting..." : feedbackLoading ? "Generating Feedback..." : "Start Interview"}
          </button>
        ) : (
          <button className="relative btn-call bg-red-500 hover:bg-red-600" onClick={handleDisconnect}>
            End Interview
          </button>
        )}
      </div>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </>
  );
};

export default Agent;
