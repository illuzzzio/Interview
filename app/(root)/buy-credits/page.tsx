"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

const creditPacks = [
  { credits: 10, price: 19 },
  { credits: 100, price: 99 },
  { credits: 300, price: 199 },
  { credits: 1000, price: 599 },
];

const BuyCreditsPage: React.FC = () => {
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBuy = async (credits: number) => {
    setLoading(credits);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to create checkout session.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 p-8 rounded-3xl shadow-2xl text-white border border-green-400 bg-transparent">
      <h2 className="text-3xl font-extrabold mb-8 text-center text-green-200 drop-shadow-lg">Buy Credits</h2>
      {error && <div className="mb-6 text-red-400 text-center font-bold text-lg bg-red-900/40 p-3 rounded-lg shadow">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {creditPacks.map((pack) => (
          <div key={pack.credits} className="flex flex-col items-center p-6 bg-white/10 rounded-2xl shadow-lg border-2 border-green-400 hover:scale-105 transition-transform duration-200">
            <div className="text-4xl font-extrabold text-green-200 mb-2 drop-shadow">{pack.credits} Credits</div>
            <div className="text-2xl font-bold mb-4 text-green-100">₹{pack.price}</div>
            <Button
              className="bg-white text-green-700 font-bold px-6 py-3 rounded-lg shadow hover:bg-green-100 transition-all duration-200 w-full"
              onClick={() => handleBuy(pack.credits)}
              disabled={loading !== null}
            >
              {loading === pack.credits ? "Redirecting..." : "Buy Now"}
            </Button>
          </div>
        ))}
      </div>
      <p className="text-center text-green-200 mt-10 text-lg font-medium">1 Interview = 10 Credits</p>
    </div>
  );
};

export default BuyCreditsPage; 