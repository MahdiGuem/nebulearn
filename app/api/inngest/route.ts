import { inngest } from "@/lib/inngest/client";
import { serve } from "inngest/next";
import { processPdfFunction } from "@/lib/inngest/functions/process-pdf";

// Serve Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processPdfFunction],
});
