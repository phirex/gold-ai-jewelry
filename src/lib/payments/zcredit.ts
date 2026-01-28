/**
 * Z-Credit Payment Gateway Client
 * Israeli payment gateway integration for credit card processing
 *
 * API Documentation: https://pci.zcredit.co.il
 * Integration based on Z-Credit's redirect flow
 *
 * Credentials:
 * - API Key: Used for backend operations (refunds, queries, webhook validation)
 * - Terminal Number (מספר מסוף): Merchant terminal identifier
 * - Terminal Password (סיסמת מסוף): Authentication for payment requests
 */

export enum ZCreditCurrency {
  NIS = 1,
  USD = 2,
}

export enum ZCreditLanguage {
  Hebrew = "he-IL",
  English = "en-US",
}

export interface ZCreditCartItem {
  Name: string;
  PictureURL: string;
  SN: string; // Serial number / SKU
  Amount: number; // Quantity
  ItemPrice: number;
}

export interface ZCreditPaymentRequest {
  terminalNumber: string;
  username: string;
  paymentSum: number;
  paymentsNumber: number; // Number of installments (1 = single payment)
  language: ZCreditLanguage;
  currency: ZCreditCurrency;
  uniqueId: string; // Order ID
  itemDescription: string;
  itemQuantity: number;
  itemPicture?: string;
  redirectUrl: string;
  notifyUrl: string; // Webhook URL for payment notifications
  cancelUrl: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerBusinessId?: string; // ת.ז. / ח.פ.
  cartItems?: ZCreditCartItem[];
  usePaymentsRange?: boolean;
  showHolderId?: boolean;
  authorizeOnly?: boolean;
  hideCustomer?: boolean;
  cssType?: number; // 1-4 for different CSS styles
  isResponsive?: boolean;
  numberOfFailures?: number;
  isIframe?: boolean;
}

export interface ZCreditTokenResponse {
  success: boolean;
  paymentUrl?: string;
  guid?: string;
  error?: string;
}

export interface ZCreditCallbackData {
  UniqueID: string;
  ApprovalNumber?: string;
  GUID?: string;
  ReferenceNumber?: string;
  Last4Digits?: string;
  CardBrand?: string;
  TransactionSum?: string;
  PaymentType?: string;
  Installments?: string;
  ErrorCode?: string;
  ErrorMessage?: string;
}

const ZCREDIT_API_URL = "https://pci.zcredit.co.il/WebControl/RequestToken.aspx";
const ZCREDIT_TRANSACTION_URL = "https://pci.zcredit.co.il/WebControl/Transaction.aspx";
const ZCREDIT_API_BASE = "https://pci.zcredit.co.il/ZCreditWS/api";

/**
 * Z-Credit client class for payment processing
 */
export class ZCreditClient {
  private terminalNumber: string;
  private username: string;
  private apiKey?: string;

  constructor(terminalNumber: string, username: string, apiKey?: string) {
    this.terminalNumber = terminalNumber;
    this.username = username;
    this.apiKey = apiKey;
  }

  /**
   * Create a payment request and get a redirect URL
   */
  async createPayment(request: Omit<ZCreditPaymentRequest, "terminalNumber" | "username">): Promise<ZCreditTokenResponse> {
    try {
      const cartItemsJSON = request.cartItems ? JSON.stringify(request.cartItems) : "[]";

      const params = new URLSearchParams({
        TerminalNumber: this.terminalNumber,
        Username: this.username,
        PaymentSum: request.paymentSum.toString(),
        PaymentsNumber: request.paymentsNumber.toString(),
        Lang: request.language,
        Currency: request.currency.toString(),
        UniqueID: request.uniqueId,
        ItemDescription: request.itemDescription,
        ItemQtty: request.itemQuantity.toString(),
        ItemPicture: request.itemPicture || "",
        RedirectLink: encodeURIComponent(request.redirectUrl),
        NotifyLink: encodeURIComponent(request.notifyUrl),
        CancelLink: encodeURIComponent(request.cancelUrl),
        UsePaymentsRange: (request.usePaymentsRange ?? false).toString(),
        ShowHolderID: (request.showHolderId ?? false).toString(),
        AuthorizeOnly: (request.authorizeOnly ?? false).toString(),
        HideCustomer: (request.hideCustomer ?? false).toString(),
        CssType: (request.cssType ?? 1).toString(),
        IsCssResponsive: (request.isResponsive ?? true).toString(),
        NumberOfFailures: (request.numberOfFailures ?? 3).toString(),
        IsIFrame: (request.isIframe ?? false).toString(),
        CartItems: cartItemsJSON,
      });

      // Add optional customer information
      if (request.customerName) {
        params.set("CustomerName", request.customerName);
      }
      if (request.customerPhone) {
        params.set("CustomerPhoneNumber", request.customerPhone);
      }
      if (request.customerEmail) {
        params.set("CustomerEmail", request.customerEmail);
      }
      if (request.customerBusinessId) {
        params.set("CustomerBusinessID", request.customerBusinessId);
      }

      const response = await fetch(ZCREDIT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const responseText = await response.text();
      
      // Parse the response - first line is GUID, rest is data package
      const lines = responseText.trim().split("\n");
      
      if (lines.length < 2) {
        return {
          success: false,
          error: responseText || "Failed to get payment token",
        };
      }

      const guid = lines[0].trim();
      const dataPackage = lines[1].trim();

      // Validate GUID format
      const guidPattern = /^[A-Za-z0-9]{8}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{12}$/;
      if (!guidPattern.test(guid)) {
        return {
          success: false,
          error: `Invalid response from Z-Credit: ${responseText}`,
        };
      }

      const paymentUrl = `${ZCREDIT_TRANSACTION_URL}?GUID=${guid}&DataPackage=${dataPackage}`;

      return {
        success: true,
        paymentUrl,
        guid,
      };
    } catch (error) {
      console.error("Z-Credit payment creation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Validate callback data from Z-Credit webhook
   */
  static validateCallback(data: ZCreditCallbackData): boolean {
    // Basic validation - check required fields
    if (!data.UniqueID) {
      return false;
    }

    // If there's an error, the payment failed
    if (data.ErrorCode && data.ErrorCode !== "0") {
      return false;
    }

    // Success requires GUID and approval number
    return !!(data.GUID && data.ApprovalNumber);
  }

  /**
   * Parse webhook callback data
   */
  static parseCallback(formData: FormData | URLSearchParams | Record<string, string>): ZCreditCallbackData {
    const getData = (key: string): string | undefined => {
      if (formData instanceof FormData || formData instanceof URLSearchParams) {
        return formData.get(key)?.toString();
      }
      return formData[key];
    };

    return {
      UniqueID: getData("UniqueID") || "",
      ApprovalNumber: getData("ApprovalNumber"),
      GUID: getData("GUID"),
      ReferenceNumber: getData("ReferenceNumber"),
      Last4Digits: getData("Last4Digits"),
      CardBrand: getData("CardBrand"),
      TransactionSum: getData("TransactionSum"),
      PaymentType: getData("PaymentType"),
      Installments: getData("Installments"),
      ErrorCode: getData("ErrorCode"),
      ErrorMessage: getData("ErrorMessage"),
    };
  }

  /**
   * Get transaction details using API key
   * Used for verifying payments and getting transaction status
   */
  async getTransactionDetails(transactionGuid: string): Promise<{
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
  }> {
    if (!this.apiKey) {
      return { success: false, error: "API key not configured" };
    }

    try {
      const response = await fetch(`${ZCREDIT_API_BASE}/Transaction/GetTransaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify({
          TerminalNumber: this.terminalNumber,
          GUID: transactionGuid,
        }),
      });

      if (!response.ok) {
        return { success: false, error: `API error: ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Z-Credit API error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  /**
   * Process a refund for a transaction
   * Requires API key for authentication
   */
  async refundTransaction(
    transactionGuid: string,
    amount?: number // If not provided, full refund
  ): Promise<{
    success: boolean;
    refundGuid?: string;
    error?: string;
  }> {
    if (!this.apiKey) {
      return { success: false, error: "API key not configured" };
    }

    try {
      const response = await fetch(`${ZCREDIT_API_BASE}/Transaction/Refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify({
          TerminalNumber: this.terminalNumber,
          Username: this.username,
          OriginalGUID: transactionGuid,
          ...(amount !== undefined && { RefundAmount: amount }),
        }),
      });

      if (!response.ok) {
        return { success: false, error: `API error: ${response.status}` };
      }

      const data = await response.json();
      
      if (data.Success || data.success) {
        return { success: true, refundGuid: data.RefundGUID || data.GUID };
      }

      return { success: false, error: data.ErrorMessage || "Refund failed" };
    } catch (error) {
      console.error("Z-Credit refund error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
}

/**
 * Get the Z-Credit client from environment variables
 */
export function getZCreditClient(): ZCreditClient {
  const terminalNumber = process.env.ZCREDIT_TERMINAL_NUMBER;
  const username = process.env.ZCREDIT_USERNAME;
  const apiKey = process.env.ZCREDIT_API_KEY;

  if (!terminalNumber || !username) {
    throw new Error("Z-Credit credentials not configured. Set ZCREDIT_TERMINAL_NUMBER and ZCREDIT_USERNAME.");
  }

  return new ZCreditClient(terminalNumber, username, apiKey);
}

/**
 * Helper to create cart items from order items
 */
export function createCartItems(items: Array<{
  name: string;
  imageUrl?: string;
  sku?: string;
  quantity: number;
  price: number;
}>): ZCreditCartItem[] {
  return items.map((item) => ({
    Name: item.name.slice(0, 127), // Max 127 chars
    PictureURL: item.imageUrl || "",
    SN: item.sku || "",
    Amount: item.quantity,
    ItemPrice: item.price,
  }));
}
