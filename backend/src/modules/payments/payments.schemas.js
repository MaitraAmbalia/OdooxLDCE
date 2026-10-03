import { z } from 'zod';

export const paymentIdParams = z.object({ id: z.uuid() });

// Body of POST /payments/:id/confirm (values come from Razorpay checkout's success callback).
export const confirmBody = z.object({
  gatewayPaymentId: z.string().min(1).max(100),
  gatewaySignature: z.string().min(1).max(200),
});
