import ResultsClient from "@/app/(root)/interview/[interviewId]/results/ResultsClient";

export default function Page({ params }: { params: { interviewId: string } }) {
  return <ResultsClient interviewId={params.interviewId} />;
}
