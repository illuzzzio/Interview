// app/(root)/interview/[interviewId]/results/page.tsx
import React from "react";
import ResultsClient from "./ResultsClient";

interface PageProps {
  params: {
    interviewId: string;
  };
}

const Page = async ({ params }: PageProps) => {
  const { interviewId } = params;

  return <ResultsClient interviewId={interviewId} />;
};

export default Page;
