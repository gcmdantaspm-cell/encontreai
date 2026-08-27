import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser for JSON
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Stripe Checkout Session endpoint
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        return res.status(500).json({ error: "Stripe integration is not configured yet. STRIPE_SECRET_KEY is missing." });
      }

      const stripeClient = new Stripe(stripeKey, { apiVersion: "2023-10-16" as any });
      const { proposalId, serviceTitle, price, fee } = req.body;
      const totalAmount = Math.round((price + fee) * 100); // in cents

      // We'll use the origin to redirect back to the app
      const origin = req.headers.origin || process.env.VITE_PUBLIC_URL || "http://localhost:3000";

      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: serviceTitle || "Serviço EncontreAi",
              },
              unit_amount: totalAmount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/pedidos?payment=success&proposalId=${proposalId}`,
        cancel_url: `${origin}/chat-list?payment=cancelled`,
        metadata: {
          proposalId,
        },
      });

      res.json({ id: session.id, url: session.url });
    } catch (err: any) {
      console.error("Stripe error:", err);
      res.status(500).json({ error: err.message || "Failed to create checkout session" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
