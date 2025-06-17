"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

const creditPacks = [
  { credits: 10, price: 19 },
  { credits: 100, price: 99 },
  { credits: 300, price: 199 },
  { credits: 1000, price: 599 },
];

// Razorpay script loader
function loadRazorpayScript() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const BuyCreditsPage: React.FC = () => {
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBuy = async (credits: number) => {
    setLoading(credits);
    setError(null);
    const price = creditPacks.find((p) => p.credits === credits)?.price;
    if (!price) {
      setError("Invalid credit pack.");
      setLoading(null);
      return;
    }
    const res = await loadRazorpayScript();
    if (!res) {
      setError("Failed to load Razorpay SDK. Please try again.");
      setLoading(null);
      return;
    }
    try {
      const response = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits, amount: price }),
      });
      const data = await response.json();
      if (!data.order) {
        setError(data.error || "Failed to create Razorpay order.");
        setLoading(null);
        return;
      }
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "EzzHire Credits",
        description: `${credits} Credits`,
        order_id: data.order.id,
        handler: async function (response: RazorpayResponse) {
          try {
            // Verify the payment
            const verifyResponse = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();
            if (verifyData.verified) {
              window.location.href = "/buy-credits?success=1";
            } else {
              setError("Payment verification failed. Please contact support.");
            }
          } catch (error) {
            setError("Failed to verify payment. Please contact support.");
          }
        },
        prefill: {},
        theme: { color: "#22c55e" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
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