// sBTC Payment Gateway API
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// In-memory storage (replace with database in production)
const merchants = new Map();
const apiKeys = new Map();
const payments = new Map();

// Utility Functions
function generateApiKey() {
  return "pk_test_" + crypto.randomBytes(32).toString("hex");
}

function generateSecretKey() {
  return "sk_test_" + crypto.randomBytes(32).toString("hex");
}

function validateApiKey(apiKey) {
  return apiKeys.has(apiKey);
}

function getMerchantFromApiKey(apiKey) {
  return apiKeys.get(apiKey);
}

// Routes

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Register merchant
app.post("/api/merchants/register", async (req, res) => {
  try {
    const { businessName, email, stacksAddress } = req.body;

    if (!businessName || !email || !stacksAddress) {
      return res.status(400).json({
        error: "Missing required fields: businessName, email, stacksAddress",
      });
    }

    const merchantId = uuidv4();
    const apiKey = generateApiKey();
    const secretKey = generateSecretKey();

    const merchantData = {
      id: merchantId,
      businessName,
      email,
      stacksAddress,
      apiKey,
      secretKey,
      isActive: true,
      createdAt: new Date().toISOString(),
      totalPayments: 0,
      totalVolume: 0,
    };

    merchants.set(merchantId, merchantData);
    apiKeys.set(apiKey, merchantId);

    console.log("Merchant registered:", merchantId);

    res.json({
      merchantId,
      businessName,
      email,
      apiKey,
      isActive: true,
      createdAt: merchantData.createdAt,
    });
  } catch (error) {
    console.error("Error registering merchant:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create payment intent
app.post("/api/payment-intents", async (req, res) => {
  try {
    const apiKey = req.headers.authorization?.replace("Bearer ", "");

    if (!apiKey || !validateApiKey(apiKey)) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    const merchantId = getMerchantFromApiKey(apiKey);
    const merchant = merchants.get(merchantId);

    if (!merchant || !merchant.isActive) {
      return res.status(403).json({ error: "Merchant not found or inactive" });
    }

    const { amount, currency = "sBTC", description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const paymentId = uuidv4();
    const intentId = uuidv4();
    const amountInSats = Math.floor(amount);
    const fee = Math.floor(amountInSats * 0.025); // 2.5% fee

    const paymentIntent = {
      id: intentId,
      paymentId,
      merchantId,
      amount: amountInSats,
      fee,
      currency,
      status: "requires_payment",
      description: description || null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      clientSecret: `pi_${intentId}_secret_${crypto
        .randomBytes(16)
        .toString("hex")}`,
    };

    payments.set(intentId, paymentIntent);

    console.log("Payment intent created:", intentId);

    res.json({
      id: intentId,
      amount: amountInSats,
      fee,
      currency,
      status: paymentIntent.status,
      description,
      clientSecret: paymentIntent.clientSecret,
      createdAt: paymentIntent.createdAt,
      expiresAt: paymentIntent.expiresAt,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get payment intent
app.get("/api/payment-intents/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const paymentIntent = payments.get(id);

    if (!paymentIntent) {
      return res.status(404).json({ error: "Payment intent not found" });
    }

    // Check if expired
    if (new Date() > new Date(paymentIntent.expiresAt)) {
      paymentIntent.status = "expired";
      payments.set(id, paymentIntent);
    }

    res.json({
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      fee: paymentIntent.fee,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      description: paymentIntent.description,
      createdAt: paymentIntent.createdAt,
      expiresAt: paymentIntent.expiresAt,
    });
  } catch (error) {
    console.error("Error getting payment intent:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Confirm payment
app.post("/api/payment-intents/:id/confirm", async (req, res) => {
  try {
    const { id } = req.params;
    const { customerAddress } = req.body;

    const paymentIntent = payments.get(id);

    if (!paymentIntent) {
      return res.status(404).json({ error: "Payment intent not found" });
    }

    if (paymentIntent.status !== "requires_payment") {
      return res.status(400).json({
        error: `Payment intent is in ${paymentIntent.status} state`,
      });
    }

    if (new Date() > new Date(paymentIntent.expiresAt)) {
      paymentIntent.status = "expired";
      payments.set(id, paymentIntent);
      return res.status(400).json({ error: "Payment intent has expired" });
    }

    // Update payment intent
    paymentIntent.status = "processing";
    paymentIntent.customerAddress = customerAddress;
    paymentIntent.processingStartedAt = new Date().toISOString();
    payments.set(id, paymentIntent);

    console.log("Payment processing started:", id);

    // Simulate processing (in real implementation, this would interact with Stacks)
    setTimeout(() => {
      try {
        paymentIntent.status = "succeeded";
        paymentIntent.completedAt = new Date().toISOString();
        paymentIntent.transactionId = `tx_${crypto
          .randomBytes(16)
          .toString("hex")}`;
        payments.set(id, paymentIntent);

        // Update merchant stats
        const merchant = merchants.get(paymentIntent.merchantId);
        if (merchant) {
          merchant.totalPayments += 1;
          merchant.totalVolume += paymentIntent.amount;
          merchants.set(paymentIntent.merchantId, merchant);
        }

        console.log("Payment completed:", id);
      } catch (error) {
        console.error("Error processing payment:", error);
        paymentIntent.status = "failed";
        paymentIntent.failedAt = new Date().toISOString();
        payments.set(id, paymentIntent);
      }
    }, 3000); // 3 second delay to simulate processing

    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      message: "Payment is being processed",
    });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get merchant dashboard stats
app.get("/api/merchants/dashboard", async (req, res) => {
  try {
    const apiKey = req.headers.authorization?.replace("Bearer ", "");

    if (!apiKey || !validateApiKey(apiKey)) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    const merchantId = getMerchantFromApiKey(apiKey);
    const merchant = merchants.get(merchantId);

    if (!merchant) {
      return res.status(404).json({ error: "Merchant not found" });
    }

    const merchantPayments = Array.from(payments.values()).filter(
      (p) => p.merchantId === merchantId
    );

    const stats = {
      totalPayments: merchantPayments.length,
      succeededPayments: merchantPayments.filter(
        (p) => p.status === "succeeded"
      ).length,
      totalVolume: merchantPayments
        .filter((p) => p.status === "succeeded")
        .reduce((sum, p) => sum + p.amount, 0),
      totalFees: merchantPayments
        .filter((p) => p.status === "succeeded")
        .reduce((sum, p) => sum + p.fee, 0),
      recentPayments: merchantPayments
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map((p) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          createdAt: p.createdAt,
        })),
    };

    res.json(stats);
  } catch (error) {
    console.error("Error getting dashboard data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 sBTC Payment Gateway API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`💾 Using in-memory storage (${merchants.size} merchants)`);
});

module.exports = app;
