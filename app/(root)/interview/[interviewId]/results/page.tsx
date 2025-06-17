"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";

const ResultsPage = ({ params }: { params: { interviewId: string } }) => {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<any>(null);
  const [deleted, setDeleted] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();
  const { interviewId } = params;

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

  const handleDownload = () => {
    if (!feedback) return;
    const content = `Interview Feedback\n\nTotal Score: ${feedback.totalScore}/100\n\nAssessment: ${feedback.finalAssessment}\n\nStrengths: ${feedback.strengths?.join(", ") || "-"}\n\nAreas for Improvement: ${feedback.areasForImprovement?.join(", ") || "-"}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-feedback-${interviewId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!feedback) return;
    const doc = new jsPDF();
    // Black background
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 297, 'F');
    // White shining header
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text("Interview Feedback Report", 105, 20, { align: "center" });
    doc.setFontSize(13);
    doc.setTextColor(200, 200, 255);
    let y = 35;
    doc.text(`Interview ID: ${interviewId}`, 14, y);
    y += 8;
    doc.text(`Date: ${new Date(feedback.createdAt).toLocaleString()}`, 14, y);
    y += 8;
    doc.text(`Interview Type: ${feedback.type || 'Unknown'}`, 14, y);
    y += 8;
    doc.text(`Level: ${feedback.level || 'Unknown'}`, 14, y);
    y += 8;
    doc.text(`Questions Answered: ${feedback.numQuestionsAnswered ?? '-'}`, 14, y);
    y += 8;
    doc.text(`Questions Asked: ${feedback.numQuestionsAsked ?? '-'}`, 14, y);
    y += 8;
    doc.text(`Engagement Level: ${feedback.engagementLevel ?? '-'}`, 14, y);
    y += 8;
    doc.text(`Avg. Response Length: ${feedback.responseLength ?? '-'} chars`, 14, y);
    y += 10;
    doc.setDrawColor(255, 255, 255);
    doc.line(14, y, 196, y);
    y += 8;
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("Scores:", 14, y);
    y += 10;
    feedback.categoryScores?.forEach((cat: any) => {
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text(`${cat.name}:`, 18, y);
      doc.setTextColor(0, 255, 200);
      doc.text(`${cat.score}/100`, 80, y);
      doc.setTextColor(200, 200, 255);
      doc.setFontSize(11);
      doc.text(`Comment: ${cat.comment || '-'}`, 100, y);
      y += 8;
    });
    doc.setTextColor(255, 255, 255);
    y += 6;
    doc.setDrawColor(255, 255, 255);
    doc.line(14, y, 196, y);
    y += 10;
    doc.setFontSize(15);
    doc.text("Total Score:", 14, y);
    doc.setFontSize(15);
    doc.setTextColor(0, 255, 200);
    doc.text(`${feedback.totalScore}/100`, 50, y);
    doc.setTextColor(255, 255, 255);
    y += 12;
    doc.setFontSize(14);
    doc.text("Assessment:", 14, y);
    y += 8;
    doc.setFontSize(12);
    const assessmentLines = doc.splitTextToSize(feedback.finalAssessment || "-", 180);
    doc.text(assessmentLines, 14, y);
    y += assessmentLines.length * 7 + 4;
    doc.setFontSize(14);
    doc.text("Strengths:", 14, y);
    y += 8;
    doc.setFontSize(12);
    const strengthsLines = doc.splitTextToSize((feedback.strengths || []).join(", ") || "-", 180);
    doc.text(strengthsLines, 14, y);
    y += strengthsLines.length * 7 + 4;
    doc.setFontSize(14);
    doc.text("Areas for Improvement:", 14, y);
    y += 8;
    doc.setFontSize(12);
    const improvementLines = doc.splitTextToSize((feedback.areasForImprovement || []).join(", ") || "-", 180);
    doc.text(improvementLines, 14, y);
    y += improvementLines.length * 7 + 4;
    if (feedback.totalScore === 0) {
      doc.setFontSize(16);
      doc.setTextColor(255, 0, 0);
      doc.text("Try next time with more preparation!", 14, y);
    }
    // Footer
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text("Powered by ", 14, 285);
    doc.setTextColor(34, 197, 94); // EzzHire in green
    doc.text("EzzHire", 50, 285);
    doc.setTextColor(200, 200, 255);
    doc.text("App made by Pranjal Malhotra", 14, 292);
    doc.save(`interview-feedback-${interviewId}.pdf`);
    // After download, delete feedback
    try {
      const res = await fetch(`/api/interview/${interviewId}/feedback`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDeleted(true);
        setFeedback(null);
      } else {
        setDeleteError(data.error || 'Failed to delete feedback');
      }
    } catch (err) {
      setDeleteError('Failed to delete feedback');
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg text-black">
      {loading ? (
        <div>Loading feedback...</div>
      ) : deleted ? (
        <div className="text-green-400 font-bold text-xl text-center">Feedback deleted after download.</div>
      ) : feedback ? (
        <>
          <h2 className="text-2xl font-bold mb-4">Interview Results</h2>
          <div className="mb-2 font-semibold">Total Score: {feedback.totalScore}/100</div>
          <div className="mb-2">Assessment: {feedback.finalAssessment}</div>
          <div className="mb-2">Strengths: {feedback.strengths?.join(", ")}</div>
          <div className="mb-2">Areas for Improvement: {feedback.areasForImprovement?.join(", ")}</div>
          <div className="mb-2">
            <span className="font-semibold">Category Scores:</span>
            <ul className="ml-4 mt-2">
              {feedback.categoryScores?.map((cat: any, idx: number) => (
                <li key={idx} className="mb-1">
                  <span className="font-bold text-green-700">{cat.name}:</span> <span className="text-black">{cat.score}/100</span> <span className="text-gray-500">({cat.comment})</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mb-2">Interview Type: <span className="font-bold">{feedback.type}</span></div>
          <div className="mb-2">Level: <span className="font-bold">{feedback.level}</span></div>
          <Button className="bg-green-500 hover:bg-green-600 mt-4" onClick={handleDownload}>
            Download Feedback
          </Button>
          <Button className="bg-green-500 hover:bg-green-600 mt-4 ml-2" onClick={handleDownloadPDF}>
            Download Feedback (PDF)
          </Button>
          {deleteError && <div className="text-red-400 mt-4">{deleteError}</div>}
        </>
      ) : (
        <div>No feedback found for this interview.</div>
      )}
    </div>
  );
};

export default ResultsPage; 