import React, { useState } from "react";
import { 
  Check, 
  HelpCircle, 
  DollarSign, 
  Sparkles, 
  Shield, 
  Zap, 
  Flame,
  CreditCard,
  Users
} from "lucide-react";
import { auth, db } from "../firebase";
import { logUserInteraction } from "../utils/logger";
import confetti from "canvas-confetti";

interface PricingPageProps {
  onLogin: () => void;
  addToast: (message: string, type?: "success" | "info" | "warning") => void;
}

// Dynamically load Razorpay standard scripts
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PricingPage({ onLogin, addToast }: PricingPageProps) {
  const [isAnnual, setIsAnnual] = useState(true);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [showPaymentChoiceModal, setShowPaymentChoiceModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [chosenMethod, setChosenMethod] = useState<"upi" | "card">("upi");
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [celebratedPlan, setCelebratedPlan] = useState<any>(null);

  const plans = [
    {
      id: "free",
      name: "Free Hobbyist",
      description: "Perfect for builders finding open-source SaaS alternatives.",
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        "Unlimited custom project searches",
        "Compare up to 3 options simultaneously",
        "Public profile list indexing",
        "Standard Community Hub posting",
        "Browse Open Source Market"
      ],
      cta: "Current Free Tier",
      popular: false,
      color: "bg-white",
      btnColor: "bg-stone-50 hover:bg-stone-100 font-bold"
    },
    {
      id: "test_1rs",
      name: "₹1 Live Tester Gate",
      description: "Quick ₹1 sandbox billing verification. Perfect for checking live integration.",
      monthlyPrice: 0.012,
      annualPrice: 0.012,
      features: [
        "Everything in Hobbyist, PLUS:",
        "Durable ⚡ Tester Badge displayed everywhere",
        "Verify standard UPI, Cards, and Netbanking",
        "Instant live production status check"
      ],
      cta: "Verify Live with ₹1",
      popular: false,
      color: "bg-emerald-50 border-emerald-500",
      btnColor: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-[2px_2px_0_0_#000000]"
    },
    {
      id: "pro",
      name: "Alt Pro",
      description: "For teams and serious builders scaling alternative software products.",
      monthlyPrice: 19,
      annualPrice: 14,
      features: [
        "Everything in Hobbyist, PLUS:",
        "Priority project queue listings",
        "Deep AI smart comparison breakdown",
        "Unlock voting & create polls in Community",
        "Up to 20 cross-comparisons instantly",
        "Verified Professional Developer badge"
      ],
      cta: "Upgrade to Alt Pro",
      popular: true,
      color: "bg-[#fed7aa] border-[#f97316]",
      btnColor: "bg-[#f97316] text-white hover:bg-orange-600 shadow-[2px_2px_0_0_#000000]"
    },
    {
      id: "enterprise",
      name: "Product Scale",
      description: "Dedicated resources for large integrations, migration suites, and agencies.",
      monthlyPrice: 49,
      annualPrice: 39,
      features: [
        "Everything in Alt Pro, PLUS:",
        "Unlimited search & crawler access",
        "Custom private tech stack audit suite",
        "Dedicated account technical lead",
        "Early beta access to automated migrations",
        "Custom contract agreements & SLA logs"
      ],
      cta: "Acquire Scale Tier",
      popular: false,
      color: "bg-[#ddd6fe] border-[#7c3aed]",
      btnColor: "bg-[#7c3aed] text-white hover:bg-indigo-700 shadow-[2px_2px_0_0_#000000]"
    }
  ];

  const handleCheckoutInit = async (plan: typeof plans[0]) => {
    if (!auth.currentUser) {
      addToast?.("Please connect your profile to upgrade plans!", "warning");
      onLogin();
      return;
    }

    if (plan.id === "free") {
      addToast?.("You are already on the current free plan", "info");
      return;
    }

    setSelectedPlan(plan);
    setShowPaymentChoiceModal(true);
  };

  const executePayment = async () => {
    if (!selectedPlan) return;
    const plan = selectedPlan;

    const isUpi = chosenMethod === "upi";
    
    setShowPaymentChoiceModal(false);
    setLoadingTier(plan.id);

    let finalCurrency = isUpi ? "INR" : "USD";
    let finalPrice = 0;
    if (plan.id === "test_1rs") {
      finalCurrency = "INR";
      finalPrice = 1;
    } else {
      const usdPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
      finalPrice = isUpi ? Math.round(usdPrice * 84) : usdPrice;
    }
    const amountInSubunits = finalPrice * 100; // paise or cents

    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        addToast?.("Failed to load Razorpay payment SDK.", "warning");
        setLoadingTier(null);
        return;
      }

      addToast?.(`Initiating checkout of ${finalCurrency} ${finalPrice}...`, "info");

      // 2. Call backend to create order (convert amount to paise/cents)
      const orderRes = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: amountInSubunits,
          currency: finalCurrency,
          receipt: `rcpt_${Date.now()}_${plan.id}`
        })
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json();
        const detailMsg = typeof errData.details === 'object' ? JSON.stringify(errData.details) : errData.details;
        const errMsg = detailMsg ? `${errData.error}: ${detailMsg}` : (errData.error || "Failed to create order on server");
        throw new Error(errMsg);
      }

      const orderData = await orderRes.json();
      const orderId = orderData.order_id;

      const razorpayKey = orderData.key_id || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || "rzp_test_T1NgP63GLTYlc9";

      // 3. Open Razorpay checkout overlay with tailored payment options
      const options: any = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "OpenAlt Platform",
        description: `Upgrade to ${plan.name} (${isAnnual ? "Annual" : "Monthly"})`,
        image: "https://api.dicebear.com/7.x/identicon/svg?seed=openalt",
        order_id: orderId,
        prefill: {
          email: auth.currentUser?.email || "",
          contact: ""
        },
        theme: {
          color: "#7c3aed"
        },
        handler: async function (response: any) {
          setLoadingTier(plan.id);
          try {
            const verifyRes = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (!verifyRes.ok) {
              const verifyErr = await verifyRes.json();
              throw new Error(verifyErr.error || "Signature validation failed");
            }

            // Save new premium Tier status inside user profile node
            if (auth.currentUser) {
              const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
              await updateDoc(doc(db, "users", auth.currentUser.uid), {
                tier: plan.id,
                updatedAt: serverTimestamp()
              });
            }

            // Fire beautiful canvas confetti celebration
            confetti({
              particleCount: 180,
              spread: 100,
              origin: { y: 0.5 }
            });

            setCelebratedPlan(plan);
            setShowCongratsModal(true);

            addToast?.(`Upgrade to ${plan.name} completed successfully! Welcome aboard! ⚡`, "success");
            logUserInteraction("checkout_upgrade_success", { 
              tier: plan.name, 
              pricePaid: finalPrice, 
              currency: finalCurrency,
              billingPeriod: isAnnual ? "annual" : "monthly",
              paymentId: response.razorpay_payment_id
            });
          } catch (vErr: any) {
            console.error("Verification failed:", vErr);
            addToast?.(`Payment verification failed: ${vErr.message}`, "warning");
          } finally {
            setLoadingTier(null);
          }
        },
        modal: {
          ondismiss: function () {
            addToast?.("Payment session dismissed by user.", "info");
            setLoadingTier(null);
          }
        }
      };

      if (isUpi) {
        options.prefill.method = "upi";
        options.config = {
          display: {
            blocks: {
              upi: {
                name: "UPI App Payment (GPay, PhonePe, Paytm)",
                instruments: [
                  {
                    method: "upi"
                  }
                ]
              }
            },
            sequence: [
              "block.upi"
            ],
            preferences: {
              show_default_blocks: true
            }
          }
        };
      }

      const razorpayObject = new (window as any).Razorpay(options);
      
      razorpayObject.on("payment.failed", function (response: any) {
        addToast?.(`Payment failed: ${response.error.description}`, "warning");
        setLoadingTier(null);
      });

      razorpayObject.open();
    } catch (err: any) {
      console.error("Razorpay workflow failed:", err);
      addToast?.(`Payment preparation failed: ${err.message}`, "warning");
      setLoadingTier(null);
    }
  };

  return (
    <div className="space-y-10 font-sans">
      {/* Flare header */}
      <div className="bg-[#ddd6fe] p-6 md:p-8 border-4 border-black rounded-2xl shadow-[6px_6px_0_0_#000000] relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-purple-200 opacity-40 rounded-full border-4 border-dashed border-black translate-x-12 -translate-y-12 pointer-events-none" />
        <h2 className="text-3xl font-black text-black tracking-tight flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-black bg-[#a7f3d0] border-2 border-black p-0.5 rounded-lg shadow-[2px_2px_0_0_#000000]" />
          Choose Your OpenAlt Tier
        </h2>
        <p className="text-sm text-stone-900 font-sans mt-2 max-w-xl font-medium">
          Whether you are exploring personal dev setups or migration paths across enterprise environments, choose the perfect support level.
        </p>
      </div>

      {/* Switch monthly / annual toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border-4 border-black p-4 rounded-xl shadow-[4px_4px_0_0_#000000]">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500 fill-yellow-400 stroke-[2.5px] animate-pulse" />
          <span className="text-xs font-black text-black uppercase font-mono">Select Billing Cycle Type</span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-black uppercase ${!isAnnual ? "text-[#7c3aed]" : "text-stone-500"}`}>
            Monthly Billing
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-14 h-8 bg-black rounded-full p-1 transition-all duration-300 relative focus:outline-none cursor-pointer"
          >
            <div
              className={`w-5 h-5 bg-yellow-300 border-2 border-black rounded-full transition-all duration-300 absolute top-1 ${
                isAnnual ? "left-7" : "left-1"
              }`}
            />
          </button>
          <span className={`text-[11px] font-black uppercase flex items-center gap-1.5 ${isAnnual ? "text-[#7c3aed]" : "text-stone-500"}`}>
            Annual Billing
            <span className="text-[9px] font-mono font-black text-green-600 bg-green-150 border border-green-400 px-1.5 py-0.5 rounded uppercase">
              Save ~30%
            </span>
          </span>
        </div>
      </div>

      {/* Plans comparison cards matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
          
          return (
            <div
              key={plan.id}
              className={`border-4 border-black rounded-2xl p-6 shadow-[5px_5px_0_0_#000000] flex flex-col justify-between space-y-6 relative hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[7px_7px_0_0_#000000] transition-all ${plan.color}`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 right-4 bg-black text-yellow-300 border-2 border-black font-mono font-black text-[9px] uppercase px-2.5 py-1 rounded shadow-[1.5px_1.5px_0_0_#ea580c] tracking-widest animate-bounce">
                  ★ MOST POPULAR
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-extrabold text-black font-sans tracking-tight">{plan.name}</h3>
                  <p className="text-xs text-stone-600 font-bold mt-1 max-w-[210px] leading-snug">{plan.description}</p>
                </div>

                {/* Simulated Pricing badge */}
                <div className="border-y-2 border-dashed border-black/20 py-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-black tracking-tight font-mono">
                    {plan.id === "test_1rs" ? "₹1" : `$${price}`}
                  </span>
                  <span className="text-[10px] text-stone-600 font-mono font-bold uppercase">
                    {plan.id === "test_1rs" ? "one-time test price" : `/ ${isAnnual ? "month" : "month"}`}
                  </span>
                </div>

                {/* Features Checkbox column */}
                <div className="space-y-2 pt-2">
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs font-semibold text-black">
                      <Check className="h-4 w-4 text-green-600 shrink-0 stroke-[3px] mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action purchase button */}
              <button
                disabled={loadingTier !== null}
                onClick={() => handleCheckoutInit(plan)}
                className={`w-full text-center border-2 border-black py-2.5 rounded-lg text-xs font-black uppercase transition-all shadow-[2px_2px_0_0_#000000] hover:translate-y-[-0.5px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${plan.btnColor}`}
              >
                {loadingTier === plan.id ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Preparing...
                  </span>
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Pricing policy details comparison checklist table */}
      <div className="bg-white border-4 border-black p-6 rounded-2xl shadow-[4px_4px_0_0_#000000] space-y-4">
        <div className="flex items-center gap-1.5 border-b border-stone-200 pb-2">
          <Shield className="h-5 w-5 text-black" />
          <h3 className="font-sans font-black text-base text-black uppercase tracking-tight">OpenAlt Buyer Security Guarantees</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-stone-700">
          <div className="space-y-1">
            <h4 className="font-sans font-black text-black">Can I cancel anytime?</h4>
            <p className="leading-relaxed">
              Yes, absolutely. Canceling will immediately cease future automated renewals. Your Alt Pro access remains valid until the final expiration date of your current billing period.
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="font-sans font-black text-black">What payment structures are supported?</h4>
            <p className="leading-relaxed">
              We accept standard debit cards, mastercards, visa credit lines, and mobile wallets. All transactions are securely routed through our PCI-DSS compliant sandbox proxy.
            </p>
          </div>
        </div>
      </div>

      {/* Real Checkout Payment Method Selection Modal */}
      {showPaymentChoiceModal && selectedPlan && (
        <div id="payment-choice-modal" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black max-w-md w-full rounded-2xl p-6 shadow-[8px_8px_0_0_#000000] space-y-5 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b-2 border-dashed border-stone-200 pb-3">
              <h3 className="text-md font-black text-black uppercase tracking-tight flex items-center gap-1.5">
                <Sparkles className="h-5 w-5 text-[#7c3aed]" />
                Select Payment Pathway
              </h3>
              <button
                onClick={() => setShowPaymentChoiceModal(false)}
                className="bg-stone-100 hover:bg-stone-200 border border-black rounded-lg text-xs font-black p-1 px-2.5 cursor-pointer leading-none"
              >
                ✕ Close
              </button>
            </div>

            <div className="bg-[#fef3c7] p-3 border-2 border-black rounded-xl text-black space-y-1">
              <p className="text-[10px] font-mono uppercase font-black tracking-wider text-amber-800 leading-none">Your Selection:</p>
              <h4 className="text-base font-black leading-tight">{selectedPlan.name} Tier</h4>
              <p className="text-xs font-bold text-stone-800">
                Regular price: <span className="font-extrabold">{selectedPlan.id === "test_1rs" ? "₹1 INR" : `$${isAnnual ? selectedPlan.annualPrice : selectedPlan.monthlyPrice} USD`}</span> {selectedPlan.id === "test_1rs" ? "one-time" : (isAnnual ? "/ month" : "/ month")}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-black border-l-4 border-[#7c3aed] pl-2">
                Select Checkout Pathway:
              </p>

              {/* UPI Option */}
              <div 
                onClick={() => setChosenMethod("upi")}
                className={`border-2 border-black p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 relative ${chosenMethod === "upi" ? "bg-[#e0e7ff] shadow-[2px_2px_0_0_#4f46e5]" : "bg-stone-50 hover:bg-stone-100"}`}
              >
                <div className="mt-0.5">
                  <div className={`w-5 h-5 rounded-full border-2 border-black flex items-center justify-center ${chosenMethod === "upi" ? "bg-[#4f46e5]" : "bg-white"}`}>
                    {chosenMethod === "upi" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-black uppercase tracking-tight flex items-center gap-1.5">
                    🚀 Active UPI / GPay / PhonePe
                  </p>
                  <p className="text-[11px] text-stone-600 font-medium leading-relaxed">
                    Instantly checkout using any standard Indian UPI application (GPay, PhonePe, Paytm) or scanned QR.
                  </p>
                  <p className="text-[10px] font-black font-mono text-indigo-700">
                    Billed as: {selectedPlan.id === "test_1rs" ? "₹1 INR" : `₹${Math.round((isAnnual ? selectedPlan.annualPrice : selectedPlan.monthlyPrice) * 84)} INR`}
                  </p>
                </div>
              </div>

              {/* Card Option */}
              <div 
                onClick={() => setChosenMethod("card")}
                className={`border-2 border-black p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 relative ${chosenMethod === "card" ? "bg-[#e0e7ff] shadow-[2px_2px_0_0_#4f46e5]" : "bg-stone-50 hover:bg-stone-100"}`}
              >
                <div className="mt-0.5">
                  <div className={`w-5 h-5 rounded-full border-2 border-black flex items-center justify-center ${chosenMethod === "card" ? "bg-[#4f46e5]" : "bg-white"}`}>
                    {chosenMethod === "card" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-black uppercase tracking-tight">
                    💳 Pay via Card / Global Checkout
                  </p>
                  <p className="text-[11px] text-stone-600 font-medium leading-relaxed">
                    Check out using standard international cards (Visa, Mastercard, AMEX) or other available wallets.
                  </p>
                  <p className="text-[10px] font-black font-mono text-indigo-700">
                    Billed as: {selectedPlan.id === "test_1rs" ? "₹1 INR" : `$${isAnnual ? selectedPlan.annualPrice : selectedPlan.monthlyPrice} USD`}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setShowPaymentChoiceModal(false)}
                className="w-1/3 bg-stone-100 font-black hover:bg-stone-200 border-2 border-black py-2.5 rounded-xl text-xs uppercase text-center cursor-pointer transition-all"
              >
                Back
              </button>
              <button
                onClick={executePayment}
                className="w-2/3 bg-black text-white hover:bg-[#1e1e1e] font-black border-2 border-[#1e1e1e] py-2.5 rounded-xl text-xs uppercase text-center shadow-[3px_3px_0_0_#7c3aed] cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-all text-ellipsis overflow-hidden font-bold"
              >
                Confirm Pathway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎉 Upgraded Congrats Celebratory Modal */}
      {showCongratsModal && celebratedPlan && (
        <div id="congrats-success-modal" className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black max-w-lg w-full rounded-2xl p-6 shadow-[10px_10px_0_0_#000000] space-y-6 text-black animate-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="bg-yellow-105 border-2 border-black p-3.5 rounded-full shadow-[2px_2px_0_0_#000000]">
                <Sparkles className="h-10 w-10 text-yellow-600 fill-yellow-300 stroke-[2px]" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight font-sans">
                UPGRADE SUCCESSFUL! 🎉
              </h3>
              <p className="text-xs text-stone-650 font-bold max-w-sm">
                Thank you so much for upgrading to the <span className="text-violet-700 underline font-black">{celebratedPlan.name}</span>. Your billing profile and everywhere across the platform has been instantly updated to premium!
              </p>
            </div>

            <div className="bg-[#f5f3ff] p-4 border-2 border-black rounded-xl space-y-3.5">
              <h4 className="text-xs font-mono font-black text-[#5b21b6] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#ddd6fe] pb-1.5">
                🌟 PREMIUM BENEFITS INSTANTLY UNLOCKED:
              </h4>
              <ul className="space-y-2.5 text-xs text-stone-850 font-semibold pl-1">
                {celebratedPlan.id === "test_1rs" && (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-base leading-none">⚡</span>
                      <span><strong>Premium Tester Badge:</strong> Your exclusive <code>⚡ Tester</code> badge is active and visible next to your submissions and community posts immediately!</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-base leading-none">📡</span>
                      <span><strong>Verified Sandbox Gateway:</strong> Verified transaction successfully validated through the live Razorpay API system.</span>
                    </li>
                  </>
                )}
                {celebratedPlan.id === "pro" && (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-base leading-none">🔹</span>
                      <span><strong>Community Blue Tick:</strong> A verified blue badge appears beside your username automatically whenever you post or comment on the hub!</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-base leading-none">⭐</span>
                      <span><strong>Pro Builder Badge:</strong> Stands out in green next to your submitted SaaS items.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-base leading-none">📊</span>
                      <span><strong>Deep AI Benchmarks:</strong> Unlocked rich automatic comparison reports using native models.</span>
                    </li>
                  </>
                )}
                {celebratedPlan.id === "enterprise" && (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-base leading-none">👑</span>
                      <span><strong>Scale Elite Badge:</strong> Displayed as the top prestige indicator across the platform.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-base leading-none">🔹</span>
                      <span><strong>Community Blue Tick:</strong> Verified Check appears next to all forum submissions.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-base leading-none">🛠️</span>
                      <span><strong>Dedicated Account Support:</strong> SLA agreements and automated code migration previews unlocked.</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <div className="text-center p-3 border-2 border-dashed border-emerald-400 bg-emerald-50 rounded-xl">
              <p className="text-[11px] text-emerald-950 font-black">
                ✨ Your live Firestore profile tier has been set to "{celebratedPlan.id}". Go build some outstanding SaaS alternative pages!
              </p>
            </div>

            <button
              onClick={() => {
                setShowCongratsModal(false);
                setCelebratedPlan(null);
              }}
              className="w-full bg-[#7c3aed] text-white hover:bg-indigo-700 font-extrabold border-2 border-black py-2.5 rounded-xl text-xs uppercase text-center shadow-[4px_4px_0_0_#000000] cursor-pointer active:translate-y-0.5 transition-all"
            >
              Let's Go! ⚡
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
