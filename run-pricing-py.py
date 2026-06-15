import sys
content = open('src/components/PricingPage.tsx', 'r', encoding='utf-8').read()

if '@paddle/paddle-js' not in content:
    content = content.replace('import confetti from "canvas-confetti";', 'import confetti from "canvas-confetti";\nimport { initializePaddle, Paddle } from \'@paddle/paddle-js\';')

search_state = 'const [celebratedPlan, setCelebratedPlan] = useState<any>(null);'
replace_state = '''const [celebratedPlan, setCelebratedPlan] = useState<any>(null);
  const [paddleInstance, setPaddleInstance] = useState<Paddle | null>(null);

  React.useEffect(() => {
    initializePaddle({
      environment: 'production',
      token: (import.meta as any).env?.VITE_PADDLE_CLIENT_TOKEN || "live_a1b959d2e77cf62ce6d2e901898",
      eventCallback: async (event) => {
        if (event.name === "checkout.completed") {
          const transactionId = (event.data as any).transaction_id;
          try {
            const verifyRes = await fetch(`${(import.meta as any).env.VITE_API_URL || ""}/api/verify-paddle`, {
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
              setCelebratedPlan({ id: planId, name: planId === 'pro' ? 'Alt Pro' : 'Product Scale' });
              setShowCongratsModal(true);
            }
          } catch(e) {
            console.error("Paddle verify error", e);
          }
        }
      }
    }).then((p) => setPaddleInstance(p));
  }, []);'''

if 'const [paddleInstance' not in content:
    content = content.replace(search_state, replace_state)

search_exec = '''  const executePayment = async () => {
    if (!selectedPlan) return;
    const plan = selectedPlan;

    const isUpi = chosenMethod === "upi";
    
    setShowPaymentChoiceModal(false);
    setLoadingTier(plan.id);

    let finalCurrency = isUpi ? "INR" : "USD";'''

replace_exec = '''  const executePayment = async () => {
    if (!selectedPlan) return;
    const plan = selectedPlan;

    const isUpi = chosenMethod === "upi";
    
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
        addToast?.("Paddle is not ready yet", "warning");
        setLoadingTier(null);
        return;
      }
      
      paddleInstance.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email: auth.currentUser?.email || "" },
        customData: { userId: auth.currentUser?.uid || "", planId: plan.id }
      });
      return;
    }

    let finalCurrency = "INR";'''

if 'PADDLE INTEGRATION' not in content:
    content = content.replace(search_exec, replace_exec)

open('src/components/PricingPage.tsx', 'w', encoding='utf-8').write(content)
print('Done')
