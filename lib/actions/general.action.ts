"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

export async function createFeedback(params: CreateFeedbackParams & { type?: string; level?: string }) {
  const { interviewId, userId, transcript, feedbackId, type, level } = params;

  try {
    // If the transcript is too short, return default feedback
    if (!transcript || transcript.length < 3) {
      const feedback = {
        interviewId,
        userId,
        type: type || 'Unknown',
        level: level || 'Unknown',
        totalScore: 0,
        categoryScores: [
          { name: "Professionalism", score: 0, comment: "No professionalism detected." },
          { name: "Confidence", score: 0, comment: "No confidence detected." },
          { name: "Speaking Style", score: 0, comment: "No speaking style detected." },
          { name: "Technical Knowledge", score: 0, comment: "No technical knowledge detected." },
          { name: "Understanding of Subject", score: 0, comment: "No subject understanding detected." },
        ],
        strengths: [],
        areasForImprovement: ["Try next time with more preparation."],
        finalAssessment: "Interview was ended too quickly. Please try again with more preparation.",
        createdAt: new Date().toISOString(),
        numQuestionsAnswered: 0,
        numQuestionsAsked: 0,
        engagementLevel: 'Low',
        responseLength: 0,
      };
      let feedbackRef;
      if (feedbackId) {
        feedbackRef = db.collection("feedback").doc(feedbackId);
      } else {
        feedbackRef = db.collection("feedback").doc();
      }
      await feedbackRef.set(feedback);
      return { success: true, feedbackId: feedbackRef.id };
    }

    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Interview Type: ${type || 'Unknown'}
        Level: ${level || 'Unknown'}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Professionalism**: Did the candidate behave professionally?
        - **Confidence**: Did the candidate sound confident in their answers?
        - **Speaking Style**: Was the candidate's speaking style clear and engaging?
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Understanding of Subject**: Did the candidate show deep understanding of the subject?
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    // Calculate additional fields
    const numQuestionsAnswered = transcript.filter((msg: any) => msg.role === 'user').length;
    const numQuestionsAsked = transcript.filter((msg: any) => msg.role === 'system' || msg.role === 'assistant').length;
    const engagementLevel = transcript.length >= 10 ? 'High' : transcript.length >= 5 ? 'Medium' : 'Low';
    const userResponses = transcript.filter((msg: any) => msg.role === 'user').map((msg: any) => msg.content.length);
    const responseLength = userResponses.length > 0 ? Math.round(userResponses.reduce((a, b) => a + b, 0) / userResponses.length) : 0;

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      type: type || 'Unknown',
      level: level || 'Unknown',
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
      numQuestionsAnswered,
      numQuestionsAsked,
      engagementLevel,
      responseLength,
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection("feedback").doc(feedbackId);
    } else {
      feedbackRef = db.collection("feedback").doc();
    }

    await feedbackRef.set(feedback);

    return { success: true, feedbackId: feedbackRef.id };
  } catch (error) {
    console.error("Error saving feedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();

  return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getUserCredits(userId: string): Promise<number> {
  const userDoc = await db.collection("users").doc(userId).get();
  return userDoc.exists ? userDoc.data()?.credits ?? 0 : 0;
}

export async function deductUserCredits(userId: string, amount: number): Promise<boolean> {
  const userRef = db.collection("users").doc(userId);
  try {
    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      if (!userDoc.exists) throw new Error("User not found");
      const prevCredits = userDoc.data()?.credits ?? 0;
      if (prevCredits < amount) throw new Error("Insufficient credits");
      t.update(userRef, { credits: prevCredits - amount });
    });
    return true;
  } catch {
    return false;
  }
}
