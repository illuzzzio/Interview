// app/(root)/interview/[interviewId]/results/page.tsx

import React from "react";
import ResultsClient from "./ResultsClient";

const Page = async ({ params }: { params: { interviewId: string } }) => {
  const { interviewId } = params;

  return <ResultsClient interviewId={interviewId} />;
};

export default Page;
