const axios = require("axios");

const Payment = require("../models/paymentModel");
const Order = require("../models/orderModel");
const User = require("../models/userModel");

const {
  CASHFREE_BASE_URL,
  cashfreeHeaders,
} = require("../config/cashfree");

// ============================================================
// GET USER ID
// ============================================================

const getUserId = (req) => {
  return (
    req.user?.id ||
    req.user?._id ||
    req.user?.userId
  );
};

// ============================================================
// CREATE CASHFREE PAYMENT
// POST /api/payments/create
// ============================================================

const createCashfreePayment = async (req, res) => {
  try {
    const {
      orderId,
      userId: bodyUserId,
      paymentMethod,
    } = req.body;

    

    // ========================================================
    // GET USER ID
    // ========================================================

    const jwtUserId = getUserId(req);

    const userId =
      jwtUserId || bodyUserId;

    // ========================================================
    // VALIDATE ORDER ID
    // ========================================================

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    // ========================================================
    // VALIDATE USER ID
    // ========================================================

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    // ========================================================
    // VALIDATE PAYMENT METHOD
    // ========================================================

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod is required",
      });
    }

    // ========================================================
    // VALIDATE PAYMENT METHOD
    // ========================================================

    const allowedPaymentMethods = [
      "COD",
      "UPI",
      "CARD",
      "NET_BANKING",
      "WALLET",
      "EMI",
      "OTHER",
    ];

    if (
      !allowedPaymentMethods.includes(
        paymentMethod
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid paymentMethod",
        allowedPaymentMethods,
      });
    }

    // ========================================================
    // FIND USER
    // ========================================================

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(
      "User found:",
      user._id.toString()
    );

    // ========================================================
    // FIND ORDER
    // ========================================================

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      isDeleted: {
        $ne: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found or order does not belong to this user",
      });
    }

    console.log(
      "Order found:",
      order._id.toString()
    );

    // ========================================================
    // GET ORDER AMOUNT
    // ========================================================

    const amount =
      order.grandTotal ??
      order.totalAmount ??
      order.finalAmount ??
      order.amount;

    if (
      amount === undefined ||
      amount === null ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount in order",
      });
    }

    console.log(
      "Order amount:",
      Number(amount)
    );

    // ========================================================
    // CUSTOMER DETAILS
    // ========================================================

    const customerName =
      user.name ||
      "Hazel Customer";

    const customerEmail =
      user.email ||
      "customer@example.com";

    const customerPhone =
      user.mobileNumber;

    if (!customerPhone) {
      return res.status(400).json({
        success: false,
        message:
          "User mobile number is required",
      });
    }

    // ========================================================
    // GENERATE CASHFREE ORDER ID
    // ========================================================

    const gatewayOrderId =
      `HZ_${Date.now()}_${Math.floor(
        Math.random() * 100000
      )}`;

    // ========================================================
    // RETURN URL
    // ========================================================

    const returnUrl =
      process.env.CASHFREE_RETURN_URL ||
      "http://localhost:5173/payment/success?order_id={order_id}";

    // ========================================================
    // CASHFREE REQUEST
    // ========================================================

    const cashfreeRequest = {
      order_id: gatewayOrderId,

      order_amount: Number(amount),

      order_currency: "INR",

      customer_details: {
        customer_id: String(user._id),

        customer_name: customerName,

        customer_email: customerEmail,

        customer_phone:
          String(customerPhone),
      },

      order_meta: {
        return_url: returnUrl,
      },

      order_note:
        `Hazel payment for order ${orderId}`,
    };

    console.log(
      "Cashfree request:",
      JSON.stringify(
        cashfreeRequest,
        null,
        2
      )
    );

    // ========================================================
    // CALL CASHFREE
    // ========================================================

    const cashfreeResponse =
      await axios.post(
        `${CASHFREE_BASE_URL}/orders`,
        cashfreeRequest,
        {
          headers: cashfreeHeaders,
        }
      );

    const cashfreeData =
      cashfreeResponse.data;

    console.log(
      "Cashfree response:",
      JSON.stringify(
        cashfreeData,
        null,
        2
      )
    );

    // ========================================================
    // CHECK PAYMENT SESSION
    // ========================================================

    if (
      !cashfreeData ||
      !cashfreeData.payment_session_id
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Cashfree payment session ID not received",
        data: cashfreeData,
      });
    }

    // ========================================================
    // CREATE PAYMENT
    // ========================================================

    const payment =
      await Payment.create({
        orderId: order._id,

        userId: user._id,

        paymentId:
          `PAY_${Date.now()}_${Math.floor(
            Math.random() * 100000
          )}`,

        amount: Number(amount),

        currency: "INR",

        paymentMethod,

        gateway: "CASHFREE",

        status: "PENDING",

        gatewayOrderId:
          cashfreeData.order_id ||
          gatewayOrderId,

        paymentSessionId:
          cashfreeData.payment_session_id,

        gatewayResponse:
          cashfreeData,
      });

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({
      success: true,

      message:
        "Cashfree payment created successfully",

      data: {
        paymentId:
          payment.paymentId,

        mongoPaymentId:
          payment._id,

        orderId:
          payment.orderId,

        userId:
          payment.userId,

        amount:
          payment.amount,

        currency:
          payment.currency,

        paymentMethod:
          payment.paymentMethod,

        gateway:
          payment.gateway,

        status:
          payment.status,

        gatewayOrderId:
          payment.gatewayOrderId,

        paymentSessionId:
          payment.paymentSessionId,
      },
    });
  } catch (error) {
    console.error(
      "================================="
    );

    console.error(
      "CREATE CASHFREE PAYMENT ERROR"
    );

    console.error(
      error.response?.data ||
      error.message ||
      error
    );

    console.error(
      "================================="
    );

    return res.status(
      error.response?.status || 500
    ).json({
      success: false,

      message:
        "Failed to create Cashfree payment",

      error:
        error.response?.data ||
        error.message ||
        "Internal server error",
    });
  }
};

// ============================================================
// VERIFY CASHFREE PAYMENT
// GET /api/payments/verify/:orderId
// ============================================================

const verifyCashfreePayment = async (
  req,
  res
) => {
  try {
    const { orderId } =
      req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message:
          "orderId is required",
      });
    }

    const userId =
      getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    // ========================================================
    // FIND PAYMENT
    // ========================================================

    const payment =
      await Payment.findOne({
        orderId,
        userId,
        gateway: "CASHFREE",
        isDeleted: false,
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Payment not found",
      });
    }

    // ========================================================
    // CASHFREE GET PAYMENTS
    // ========================================================

    const response =
      await axios.get(
        `${CASHFREE_BASE_URL}/orders/${payment.gatewayOrderId}/payments`,
        {
          headers:
            cashfreeHeaders,
        }
      );

    const payments =
      response.data;

    console.log(
      "Cashfree Payments:",
      JSON.stringify(
        payments,
        null,
        2
      )
    );

    if (
      !payments ||
      !Array.isArray(payments) ||
      payments.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "No payment transaction found",
      });
    }

    // ========================================================
    // SUCCESS PAYMENT
    // ========================================================

    const successfulPayment =
      payments.find(
        (item) =>
          item.payment_status ===
          "SUCCESS"
      );

    if (successfulPayment) {
      payment.status =
        "SUCCESS";

      payment.gatewayPaymentId =
        successfulPayment.cf_payment_id ||
        "";

      payment.transactionId =
        successfulPayment.cf_payment_id ||
        "";

      payment.paidAt =
        payment.paidAt ||
        new Date();

      payment.gatewayResponse =
        payments;

      await payment.save();

      // ======================================================
      // UPDATE ORDER
      // ======================================================

      const order =
        await Order.findById(
          payment.orderId
        );

      if (order) {
        if (
          order.paymentStatus !==
          undefined
        ) {
          order.paymentStatus =
            "PAID";

          await order.save();
        }
      }

      return res.status(200).json({
        success: true,

        message:
          "Payment verified successfully",

        data: {
          paymentId:
            payment.paymentId,

          orderId:
            payment.orderId,

          userId:
            payment.userId,

          gatewayOrderId:
            payment.gatewayOrderId,

          gatewayPaymentId:
            payment.gatewayPaymentId,

          transactionId:
            payment.transactionId,

          amount:
            payment.amount,

          status:
            payment.status,

          paidAt:
            payment.paidAt,
        },
      });
    }

    // ========================================================
    // LATEST PAYMENT
    // ========================================================

    const latestPayment =
      payments[
        payments.length - 1
      ];

    // ========================================================
    // FAILED
    // ========================================================

    if (
      latestPayment?.payment_status ===
      "FAILED"
    ) {
      payment.status =
        "FAILED";

      payment.failureReason =
        latestPayment.payment_message ||
        "Payment failed";
    }

    // ========================================================
    // USER DROPPED
    // ========================================================

    else if (
      latestPayment?.payment_status ===
      "USER_DROPPED"
    ) {
      payment.status =
        "CANCELLED";
    }

    // ========================================================
    // PROCESSING
    // ========================================================

    else {
      payment.status =
        "PROCESSING";
    }

    payment.gatewayResponse =
      payments;

    await payment.save();

    return res.status(200).json({
      success: true,

      message:
        "Payment verification completed",

      data: {
        paymentId:
          payment.paymentId,

        orderId:
          payment.orderId,

        userId:
          payment.userId,

        status:
          payment.status,

        failureReason:
          payment.failureReason,
      },
    });
  } catch (error) {
    console.error(
      "VERIFY CASHFREE PAYMENT ERROR:",
      error.response?.data ||
      error.message
    );

    return res.status(
      error.response?.status || 500
    ).json({
      success: false,

      message:
        "Failed to verify Cashfree payment",

      error:
        error.response?.data ||
        error.message ||
        "Internal server error",
    });
  }
};

// ============================================================
// CASHFREE WEBHOOK
// POST /api/payments/webhook
// ============================================================

const cashfreeWebhook = async (
  req,
  res
) => {
  try {
    const data = req.body;

   
    const gatewayOrderId =
      data?.data?.order?.order_id;

    const gatewayPaymentId =
      data?.data?.payment
        ?.cf_payment_id;

    const paymentStatus =
      data?.data?.payment
        ?.payment_status;

    // ========================================================
    // VALIDATE ORDER ID
    // ========================================================

    if (!gatewayOrderId) {
      return res.status(400).json({
        success: false,
        message:
          "Cashfree order ID missing",
      });
    }

    // ========================================================
    // FIND PAYMENT
    // ========================================================

    const payment =
      await Payment.findOne({
        gatewayOrderId,
        gateway: "CASHFREE",
        isDeleted: false,
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Payment not found",
      });
    }

    // ========================================================
    // PAYMENT ID
    // ========================================================

    if (gatewayPaymentId) {
      payment.gatewayPaymentId =
        gatewayPaymentId;

      payment.transactionId =
        gatewayPaymentId;
    }

    // ========================================================
    // GATEWAY RESPONSE
    // ========================================================

    payment.gatewayResponse =
      data;

    // ========================================================
    // STATUS
    // ========================================================

    switch (
      paymentStatus
    ) {
      case "SUCCESS":

        payment.status =
          "SUCCESS";

        payment.paidAt =
          payment.paidAt ||
          new Date();

        break;

      case "FAILED":

        payment.status =
          "FAILED";

        payment.failureReason =
          data?.data?.payment
            ?.payment_message ||
          "Payment failed";

        break;

      case "USER_DROPPED":

        payment.status =
          "CANCELLED";

        break;

      case "PENDING":

        payment.status =
          "PENDING";

        break;

      default:

        payment.status =
          "PROCESSING";
    }

    await payment.save();

    // ========================================================
    // UPDATE ORDER
    // ========================================================

    if (
      payment.status ===
      "SUCCESS"
    ) {
      const order =
        await Order.findById(
          payment.orderId
        );

      if (order) {
        if (
          order.paymentStatus !==
          undefined
        ) {
          order.paymentStatus =
            "PAID";

          await order.save();
        }
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Webhook processed successfully",
    });
  } catch (error) {
    console.error(
      "CASHFREE WEBHOOK ERROR:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to process webhook",
      error:
        error.message,
    });
  }
};

// ============================================================
// GET PAYMENT BY ORDER
// GET /api/payments/order/:orderId
// ============================================================

const getPaymentByOrder = async (
  req,
  res
) => {
  try {
    const { orderId } =
      req.params;

    const userId =
      getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const payment =
      await Payment.findOne({
        orderId,
        userId,
        isDeleted: false,
      })
        .populate("orderId")
        .populate(
          "userId",
          "name email mobileNumber"
        );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to get payment",
      error:
        error.message,
    });
  }
};

// ============================================================
// GET ALL PAYMENTS
// GET /api/payments
// ============================================================

const getAllPayments = async (
  req,
  res
) => {
  try {
    const {
      status,
      gateway,
      paymentMethod,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {
      isDeleted: false,
    };

    if (status) {
      filter.status = status;
    }

    if (gateway) {
      filter.gateway = gateway;
    }

    if (paymentMethod) {
      filter.paymentMethod =
        paymentMethod;
    }

    const pageNumber =
      Math.max(
        Number(page) || 1,
        1
      );

    const limitNumber =
      Math.min(
        Math.max(
          Number(limit) || 20,
          1
        ),
        100
      );

    const skip =
      (pageNumber - 1) *
      limitNumber;

    const [
      payments,
      total,
    ] = await Promise.all([
      Payment.find(filter)
        .populate(
          "userId",
          "name email mobileNumber"
        )
        .populate("orderId")
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNumber),

      Payment.countDocuments(
        filter
      ),
    ]);

    return res.status(200).json({
      success: true,

      data: payments,

      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages:
          Math.ceil(
            total /
            limitNumber
          ),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to get payments",
      error:
        error.message,
    });
  }
};

// ============================================================
// UPDATE PAYMENT STATUS
// PUT /api/payments/:paymentId/status
// ============================================================

const updatePaymentStatus = async (
  req,
  res
) => {
  try {
    const { paymentId } =
      req.params;

    const {
      status,
      failureReason,
      refundAmount,
    } = req.body;

    const allowedStatuses = [
      "PENDING",
      "PROCESSING",
      "SUCCESS",
      "FAILED",
      "CANCELLED",
      "REFUNDED",
      "PARTIALLY_REFUNDED",
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment status",
        allowedStatuses,
      });
    }

    const payment =
      await Payment.findOne({
        _id: paymentId,
        isDeleted: false,
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Payment not found",
      });
    }

    payment.status =
      status;

    if (failureReason) {
      payment.failureReason =
        failureReason;
    }

    if (
      status ===
      "SUCCESS"
    ) {
      payment.paidAt =
        payment.paidAt ||
        new Date();

      const order =
        await Order.findById(
          payment.orderId
        );

      if (order) {
        if (
          order.paymentStatus !==
          undefined
        ) {
          order.paymentStatus =
            "PAID";

          await order.save();
        }
      }
    }

    if (
      status ===
        "REFUNDED" ||
      status ===
        "PARTIALLY_REFUNDED"
    ) {
      payment.refundedAt =
        payment.refundedAt ||
        new Date();

      if (
        refundAmount !==
        undefined
      ) {
        payment.refundAmount =
          Number(
            refundAmount
          );
      }
    }

    await payment.save();

    return res.status(200).json({
      success: true,

      message:
        "Payment status updated successfully",

      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to update payment status",
      error:
        error.message,
    });
  }
};

// ============================================================
// DELETE PAYMENT
// DELETE /api/payments/:paymentId
// ============================================================

const deletePayment = async (
  req,
  res
) => {
  try {
    const { paymentId } =
      req.params;

    const payment =
      await Payment.findOne({
        _id: paymentId,
        isDeleted: false,
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Payment not found",
      });
    }

    payment.isDeleted =
      true;

    payment.deletedAt =
      new Date();

    await payment.save();

    return res.status(200).json({
      success: true,
      message:
        "Payment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to delete payment",
      error:
        error.message,
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  createCashfreePayment,
  verifyCashfreePayment,
  cashfreeWebhook,
  getPaymentByOrder,
  getAllPayments,
  updatePaymentStatus,
  deletePayment,
};