export declare function handleVerifyPayment(req: any, body: any): Promise<{
    status: number;
    data: {
        success: boolean;
        order_id: any;
        payment_id: any;
    };
}>;
export default function handler(req: any, res: any): Promise<any>;
