const express = require("express");

const router = express.Router();

const {
  createCashfreePayment,
  verifyCashfreePayment,
  cashfreeWebhook,
  getPaymentByOrder,
  getAllPayments,
  updatePaymentStatus,
  deletePayment,
} = require("../controllers/paymentController");

const {verifyToken} = require("../middleware/authMiddleware");

// ============================================================
// CREATE CASHFREE PAYMENT
// POST /api/payments/create
// ============================================================

router.post(
  "/create",
  verifyToken,
  createCashfreePayment
);

// ============================================================
// VERIFY CASHFREE PAYMENT
// GET /api/payments/verify/:orderId
// ============================================================

router.get(
  "/verify/:orderId",
  verifyToken,
  verifyCashfreePayment
);

// ============================================================
// CASHFREE WEBHOOK
// POST /api/payments/webhook
//
// DO NOT USE AUTH MIDDLEWARE HERE
// ============================================================

router.post(
  "/webhook",
  cashfreeWebhook
);

// ============================================================
// GET PAYMENT BY ORDER
// GET /api/payments/order/:orderId
// ============================================================

router.get(
  "/order/:orderId",
  verifyToken,
  getPaymentByOrder
);

// ============================================================
// GET ALL PAYMENTS
// GET /api/payments
// ============================================================

router.get(
  "/all",
  verifyToken,
  getAllPayments
);

// ============================================================
// UPDATE PAYMENT STATUS
// PUT /api/payments/:paymentId/status
// ============================================================

router.put(
  "/status/:paymentId",
  verifyToken,
  updatePaymentStatus
);

// ============================================================
// DELETE PAYMENT
// DELETE /api/payments/:paymentId
// ============================================================

router.delete(
  "/delete/:paymentId",
  verifyToken,
  deletePayment
);

module.exports = router;