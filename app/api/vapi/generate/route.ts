import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { getRandomInterviewCover } from "@/lib/utils";
import { db } from "@/firebase/admin";
import {generateSchema} from "@/lib/schemas";

export async function GET() {
  return Response.json({ success: true, data: "THANK YOU!" }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if(generateSchema.safeParse(body).success === false) {
    
      return Response.json(
        { success: false, error: "cant process" },
        { status: 400 }
      );

    }
    const { type, role, level, techstack, amount, userid } = body; //httpie check//

    // Validate required fields
  
    // Generate interview questions using Gemini
    const { text: questions } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: `Prepare questions for a job interview. The job role is ${role}.
The job experience level is ${level}.
The tech stack includes ${techstack}.
The focus between behavioral and technical questions should lean towards: ${type}.
The amount of questions required is : ${amount}.
Please return only the questions , without any additional text.
The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters.
Return the Questions formatted like this:
["Question 1", "Question 2", "Question 3", ...]`
    });

    // Parse the questions safely
    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(questions);
      if (!Array.isArray(parsedQuestions)) {
        throw new Error("Invalid questions format");
      }
    } catch {
      console.error("Error parsing questions:", questions);
      return Response.json(
        { success: false, error: "AI response could not be parsed as valid JSON." },
        { status: 500 }
      );
    }

    const interview = {
      role,
      type,
      level,
      techstack: techstack.split(",").map((t: string) => t.trim()),
      questions: parsedQuestions,
      userId: userid,
      finalised: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString()
    };

    await db.collection("interviews").add(interview);
    return Response.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Error in POST request:", error);
    return Response.json(
      { success: false, error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
