import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";

import React from 'react'

function generateInterviewId() {
  return 'interview_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

const page = async  () => {
  const user = await getCurrentUser();
  const interviewId = generateInterviewId();
  // For demo, set interviewType and level. Later, set dynamically from user input or Vapi.
  const interviewType = 'Behavioral';
  const level = 'Junior';
  return (
   <>
   <h3>Interview Generator</h3>
   <Agent userName={user?.name ?? ""} userId={user?.id} interviewId={interviewId} type="generate" interviewType={interviewType} level={level} />
   </>
  )
}

export default page
