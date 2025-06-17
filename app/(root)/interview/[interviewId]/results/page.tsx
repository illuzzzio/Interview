import ResultsClient from "@/app/(root)/interview/[interviewId]/results/ResultsClient"; // adjust path if needed

export default function page({ params }: { params: { interviewId: string } }) {
  return <ResultsClient interviewId={params.interviewId} />;
}
