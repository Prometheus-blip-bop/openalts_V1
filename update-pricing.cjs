const fs = require('fs');

const filePath = 'src/components/PricingPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes("@paddle/paddle-js")) {
    content = content.replace('import confetti from "canvas-confetti";', `import confetti from "canvas-confetti";\nimport { initializePaddle, Paddle } from '@paddle/paddle-js';`);
}

// 2. Add state and useEffect inside the component
if (!content.includes("const [paddleInstance")) {
    const searchStr = `const [celebratedPlan, setCelebratedPlan] = useState<any>(null);`;
    const replaceStr = `const [celebratedPlan, setCelebratedPlan] = useState<any>(null);
  const [paddleInstance, setPaddleInstance] = useState<Paddle | null>(null);

  React.useEffect(() => {
    initializePaddle({
      environment: 'production',
      token: (import.meta as any).env?.VITE_PADDLE_CLIENT_TOKEN || "live_a1b959d2e77cf62ce6d2e901898",
      eventCallback: async (event) => {
        if (event.name === "checkout.completed") {
          const transactionId = (event.data as any).transaction_id;
          try {
            const verifyRes = await fetch(\`\${(import.meta as any).env.VITE_API_URL || ""}/api/verify-paddle\`, {
               method: 'POST',
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ transaction_id: transactionId })
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              const planId = verifyData.customData?.planId;
              if (auth.currentUser && planId) {
                 const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
                 await updateDoc(doc(db, "users", auth.currentUser.uid), {
                   tier: planId,
                   updatedAt: serverTimestamp()
                 });
              }
              confetti({ particleCount: 180, spread: 100, origin: { y: 0.5 } });
              setLoadingTier(null);
              // Temporary plan object for modal
              setCelebratedPlan({ id: planId, name: planId === 'pro' ? 'Alt Pro' : 'Product Scale' });
              setShowCongratsModal(true);
            }
          } catch(e) {
            console.error("Paddle verify error", e);
          }
        }
      }
    }).then((p) => setPaddleInstance(p));
  }, []);`;
    content = content.replace(searchStr, replaceStr);
}

// 3. Update executePayment
const executePaymentOld = `    const isUpi = chosenMethod === "upi";
    
    setShowPaymentChoiceModal(false);
    setLoadingTier(plan.id);

    let finalCurrency = isUpi ? "INR" : "USD";`;

const executePaymentNew = `    const isUpi = chosenMethod === "upi";
    
    setShowPaymentChoiceModal(false);
    setLoadingTier(plan.id);

    // --- PADDLE INTEGRATION FOR INTERNATIONAL / CARDS ---
    if (!isUpi) {
      let priceId = "";
      if (plan.id === "pro") {
        priceId = isAnnual ? ((import.meta as any).env?.VITE_PADDLE_PRICE_PRO_ANNUAL || "pri_annual_pro_placeholder") 
                           : ((import.meta as any).env?.VITE_PADDLE_PRICE_PRO_MONTHLY || "pri_monthly_pro_placeholder");
      } else if (plan.id === "enterprise") {
        priceId = isAnnual ? ((import.meta as any).env?.VITE_PADDLE_PRICE_ENTERPRISE_ANNUAL || "pri_annual_ent_placeholder") 
                           : ((import.meta as any).env?.VITE_PADDLE_PRICE_ENTERPRISE_MONTHLY || "pri_monthly_ent_placeholder");
      }

      if (!paddleInstance) {
        addToast?.("Payment gateway is still loading, please try again.", "warning");
        setLoadingTier(null);
        return;
      }

      addToast?.(\`Opening secure Paddle Checkout for \${plan.name}...\`, "info");
      
      paddleInstance.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: {
          email: auth.currentUser?.email || "",
        },
        customData: {
          userId: auth.currentUser?.uid || "",
          planId: plan.id
        }
      });
      return;
    }

    // --- RAZORPAY INTEGRATION FOR DOMESTIC UPI ---
    let finalCurrency = "INR";`;

if (content.includes(executePaymentOld)) {
    content = content.replace(executePaymentOld, executePaymentNew);
} else {
    console.log("Could not find executePayment hook");
}

fs.writeFileSync(filePath, content);
console.log("PricingPage.tsx updated successfully.");
