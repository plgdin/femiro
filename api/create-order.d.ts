export declare function handleCreateOrder(req: any, body: any): Promise<{
    status: number;
    data: {
        order_id: string;
        amount: string | number;
        currency: string;
        local_order_id: any;
    };
}>;
export default function handler(req: any, res: any): Promise<any>;
