import ResultsClient from "@/components/ResultsClient"; // adjust path if needed

interface PageProps {
  params: {
    interviewId: string;
  };
}

export default function Page({ params }: PageProps) {
  return <ResultsClient interviewId={params.interviewId} />;
}
