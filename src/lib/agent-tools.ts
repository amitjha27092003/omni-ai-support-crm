export interface ToolCallResult {
  toolName: string;
  actionTaken: boolean;
  message: string;
}

export function executeAgentTool(query: string, ticketId: string): ToolCallResult {
  const q = query.toLowerCase();

  // 1. Tool: Reconcile Payment
  if (q.includes("payment") || q.includes("upgrade") || q.includes("order id")) {
    return {
      toolName: "reconcile_payment_gateway",
      actionTaken: true,
      message: `Gateway reconciliation executed for ticket #${ticketId}. Transaction cleared and account upgraded automatically.`,
    };
  }

  // 2. Tool: Regenerate GST Invoice
  if (q.includes("invoice") || q.includes("gstin") || q.includes("tax")) {
    return {
      toolName: "regenerate_tax_invoice",
      actionTaken: true,
      message: `Invoice generation service triggered. Attached validated GSTIN invoice to outbound dispatch pipeline.`,
    };
  }

  // 3. Tool: Network / 502 Threshold Widener
  if (q.includes("502") || q.includes("rate limit") || q.includes("gateway error")) {
    return {
      toolName: "scale_cluster_ingress",
      actionTaken: true,
      message: `Cluster rate-limit thresholds dynamically widened to 300 req/min for client cluster.`,
    };
  }

  return {
    toolName: "standard_knowledge_lookup",
    actionTaken: false,
    message: "No autonomous write-action needed. Factual grounding reply supplied.",
  };
}