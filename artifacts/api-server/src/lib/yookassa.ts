import { logger } from "./logger";

export interface CreateYooKassaPaymentParams {
  orderId: number;
  userId: number;
  amount: number | string;
  description: string;
  returnUrl: string;
  method?: "yookassa" | "sbp" | string;
}

export interface YooKassaPaymentResponse {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  amount: {
    value: string;
    currency: string;
  };
  confirmation?: {
    type: string;
    confirmation_url?: string;
  };
  description?: string;
  metadata?: Record<string, string>;
  created_at?: string;
}

function getYooKassaConfig() {
  const shopId = process.env.YOOKASSA_SHOP_ID || "1432013";
  const secretKey = process.env.YOOKASSA_SECRET_KEY || "test_i8JyuX6HKaJhOa1YnAuXh5J2aC92jDuq_tWRFyuJCeU";
  const baseUrl = "https://api.yookassa.ru/v3";
  const authHeader = "Basic " + Buffer.from(`${shopId.trim()}:${secretKey.trim()}`).toString("base64");

  return { shopId, secretKey, baseUrl, authHeader };
}

/**
 * Creates a new payment session in YooKassa (ЮKassa API v3)
 */
export async function createYooKassaPayment(params: CreateYooKassaPaymentParams): Promise<{
  paymentId: string;
  status: string;
  confirmationUrl: string;
  paid: boolean;
}> {
  const { authHeader, baseUrl } = getYooKassaConfig();
  const numericAmount = typeof params.amount === "number" ? params.amount : parseFloat(params.amount);
  const formattedAmount = numericAmount.toFixed(2);

  const idempotenceKey = `ord_${params.orderId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const requestBody: Record<string, any> = {
    amount: {
      value: formattedAmount,
      currency: "RUB",
    },
    capture: true,
    confirmation: {
      type: "redirect",
      return_url: params.returnUrl,
    },
    description: params.description.substring(0, 128),
    metadata: {
      orderId: String(params.orderId),
      userId: String(params.userId),
    },
  };

  if (params.method === "sbp") {
    requestBody.payment_method_data = {
      type: "sbp",
    };
  }

  logger.info({ orderId: params.orderId, amount: formattedAmount, method: params.method }, "Creating YooKassa payment");

  let response = await fetch(`${baseUrl}/payments`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Idempotence-Key": idempotenceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  let data = (await response.json()) as YooKassaPaymentResponse & { description?: string; code?: string; type?: string };

  // If specific payment method (e.g. SBP) is not enabled on this test/live shop, fallback to standard hosted checkout
  if (!response.ok && data.description?.includes("Payment method is not available") && requestBody.payment_method_data) {
    logger.warn({ method: params.method, error: data.description }, "Specific payment method not enabled on shop, falling back to standard hosted checkout");
    delete requestBody.payment_method_data;
    
    response = await fetch(`${baseUrl}/payments`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Idempotence-Key": `${idempotenceKey}_fb`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    data = (await response.json()) as YooKassaPaymentResponse & { description?: string; code?: string; type?: string };
  }

  if (!response.ok) {
    const errorMsg = data.description || `YooKassa API error: ${response.status} ${response.statusText}`;
    logger.error({ status: response.status, data }, "Failed to create YooKassa payment");
    throw new Error(errorMsg);
  }

  const confirmationUrl = data.confirmation?.confirmation_url || params.returnUrl;

  logger.info({ paymentId: data.id, status: data.status, confirmationUrl }, "YooKassa payment created successfully");

  return {
    paymentId: data.id,
    status: data.status,
    confirmationUrl,
    paid: data.paid ?? false,
  };
}

/**
 * Fetches the current payment status directly from YooKassa API v3
 */
export async function getYooKassaPayment(paymentId: string): Promise<YooKassaPaymentResponse | null> {
  const { authHeader, baseUrl } = getYooKassaConfig();

  try {
    const response = await fetch(`${baseUrl}/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, errorText, paymentId }, "Failed to get YooKassa payment details");
      return null;
    }

    return (await response.json()) as YooKassaPaymentResponse;
  } catch (err) {
    logger.error({ err, paymentId }, "Error querying YooKassa payment status");
    return null;
  }
}

/**
 * Captures a payment if it is in 'waiting_for_capture' status
 */
export async function captureYooKassaPayment(paymentId: string, amount: { value: string; currency: string }): Promise<boolean> {
  const { authHeader, baseUrl } = getYooKassaConfig();
  const idempotenceKey = `cap_${paymentId}_${Date.now()}`;

  try {
    const response = await fetch(`${baseUrl}/payments/${paymentId}/capture`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Idempotence-Key": idempotenceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      logger.error({ status: response.status, paymentId }, "Failed to capture YooKassa payment");
      return false;
    }

    return true;
  } catch (err) {
    logger.error({ err, paymentId }, "Error capturing YooKassa payment");
    return false;
  }
}
