import crypto from 'crypto';
import Razorpay from 'razorpay';
import { getSupabaseAdmin, requireUser } from './auth';
export async function handleCreateOrder(req, body) {
    const user = await requireUser(req);
    const supabaseAdmin = getSupabaseAdmin();
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret)
        throw new Error('Payment service is not configured.');
    const lines = Array.isArray(body?.items) ? body.items : [];
    const address = typeof body?.delivery_address === 'string' ? body.delivery_address.trim() : '';
    const coupon = typeof body?.coupon === 'string' ? body.coupon.trim().toUpperCase() : '';
    const customerPhone = typeof body?.customer_phone === 'string' ? body.customer_phone.trim() : '';
    if (!lines.length || !address)
        throw new Error('Cart and delivery address are required.');
    if (lines.some(line => !Number.isInteger(line.id) || !Number.isInteger(line.qty) || line.qty < 1 || line.qty > 20)) {
        throw new Error('Invalid cart items.');
    }
    const ids = [...new Set(lines.map(line => line.id))];
    const { data: products, error: productError } = await supabaseAdmin
        .from('products')
        .select('id,name,type,price,image,sizes,in_stock')
        .in('id', ids);
    if (productError)
        throw productError;
    if (!products || products.length !== ids.length)
        throw new Error('A cart item is no longer available.');
    const productMap = new Map(products.map(product => [Number(product.id), product]));
    const items = lines.map(line => {
        const product = productMap.get(line.id);
        if (!product || product.in_stock === false)
            throw new Error(`${product?.name || 'Item'} is unavailable.`);
        if (product.sizes?.length && line.size && !product.sizes.includes(line.size))
            throw new Error('Invalid product size.');
        return {
            id: Number(product.id),
            name: product.name,
            type: product.type,
            price: Number(product.price),
            image: product.image,
            qty: line.qty,
            size: line.size || product.sizes?.[0] || 'Free Size'
        };
    });
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping = subtotal > 2000 ? 0 : 59;
    const packing = 15;
    let discount = 0;
    if (coupon) {
        const { data: discountRow } = await supabaseAdmin
            .from('discounts')
            .select('discount_percent,fixed_amount,type,min_spend,active,scope,category_target,product_ids')
            .eq('code', coupon)
            .eq('active', true)
            .maybeSingle();
        if (discountRow) {
            const eligibleSubtotal = items.reduce((sum, item) => {
                const eligible = discountRow.scope === 'storewide' ||
                    (discountRow.scope === 'category' && item.type === discountRow.category_target) ||
                    (discountRow.scope === 'products' && (discountRow.product_ids || []).includes(item.id));
                return eligible ? sum + item.price * item.qty : sum;
            }, 0);
            if (eligibleSubtotal <= 0 || eligibleSubtotal < Number(discountRow.min_spend || 0))
                throw new Error('This discount does not apply to the cart.');
            discount = discountRow.type === 'fixed'
                ? Number(discountRow.fixed_amount || 0)
                : Math.round(eligibleSubtotal * Number(discountRow.discount_percent || 0) / 100);
            discount = Math.min(discount, eligibleSubtotal);
        }
    }
    const gst = Math.round(Math.max(0, subtotal - discount) * 0.05);
    const total = Math.max(0, subtotal - discount + gst + shipping + packing);
    if (total < 1)
        throw new Error('Order total is too low.');
    const { data: localOrder, error: insertError } = await supabaseAdmin
        .from('orders')
        .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        items,
        total,
        status: 'Payment Pending',
        delivery_address: address,
        customer_email: user.email || null,
        customer_phone: customerPhone || null
    })
        .select('id')
        .single();
    if (insertError || !localOrder)
        throw insertError || new Error('Could not create order.');
    try {
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const order = await razorpay.orders.create({
            amount: Math.round(total * 100),
            currency: 'INR',
            receipt: `f_${localOrder.id}`,
            notes: { user_id: user.id, local_order_id: localOrder.id }
        });
        await supabaseAdmin.from('orders').update({ razorpay_order_id: order.id }).eq('id', localOrder.id);
        return { status: 200, data: { order_id: order.id, amount: order.amount, currency: order.currency, local_order_id: localOrder.id } };
    }
    catch (error) {
        await supabaseAdmin.from('orders').update({ status: 'Cancelled' }).eq('id', localOrder.id);
        throw error;
    }
}
export default async function handler(req, res) {
    if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method Not Allowed' });
    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const result = await handleCreateOrder(req, body || {});
        return res.status(result.status).json(result.data);
    }
    catch (error) {
        const message = error?.message || 'Could not create order.';
        const status = message.includes('Authentication') || message.includes('token') ? 401 : 400;
        return res.status(status).json({ error: message });
    }
}
