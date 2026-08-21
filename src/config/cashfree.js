const CASHFREE_ENV =
  process.env.CASHFREE_ENV || "sandbox";

const CASHFREE_API_VERSION =
  process.env.CASHFREE_API_VERSION ||
  "2025-01-01";

const CASHFREE_BASE_URL =
  CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const cashfreeHeaders = {
  "Content-Type": "application/json",

  Accept: "application/json",

  "x-client-id":
    process.env.CASHFREE_APP_ID,

  "x-client-secret":
    process.env.CASHFREE_SECRET_KEY,

  "x-api-version":
    CASHFREE_API_VERSION,
};

module.exports = {
  CASHFREE_ENV,
  CASHFREE_API_VERSION,
  CASHFREE_BASE_URL,
  cashfreeHeaders,
};