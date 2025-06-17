declare module 'razorpay' {
  interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }

  interface OrderOptions {
    amount: number;
    currency: string;
    receipt: string;
    payment_capture: boolean;
    notes?: Record<string, string>;
  }

  interface Order {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
    notes?: Record<string, string>;
  }

  class Razorpay {
    constructor(options: RazorpayOptions);
    orders: {
      create(options: OrderOptions): Promise<Order>;
    };
  }

  export default Razorpay;
} 