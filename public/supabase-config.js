// Supabase configuration
// Replace the placeholder with your actual public key

const SUPABASE_URL = 'https://caghluqxjxeeqkhbxovw.supabase.co';
const SUPABASE_PUBLIC_KEY = '{{SUPABASE_PUBLIC_KEY}}'; // This will be replaced at build time

// Initialize Supabase client
console.log('🔧 Initializing Supabase client...');
console.log('📍 SUPABASE_URL:', SUPABASE_URL);
console.log('🔑 SUPABASE_PUBLIC_KEY (first 20 chars):', SUPABASE_PUBLIC_KEY ? SUPABASE_PUBLIC_KEY.substring(0, 20) + '...' : 'NOT SET');

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);

if (supabaseClient) {
    console.log('✅ Supabase client initialized successfully');
} else {
    console.error('❌ Failed to initialize Supabase client');
}

// Order management functions
const OrderManager = {
    // Save order to database
    async saveOrder(orderData) {
        console.log('🚀 Starting saveOrder process...');
        console.log('📦 Order data to save:', JSON.stringify(orderData, null, 2));
        
        try {
            console.log('📡 Attempting to insert into Supabase...');
            const { data, error } = await supabaseClient
                .from('orders')
                .insert([orderData])
                .select();

            if (error) {
                console.error('❌ Supabase insert error:', error);
                console.error('❌ Error details:', JSON.stringify(error, null, 2));
                return { success: false, error: error.message };
            }

            console.log('✅ Order saved successfully to Supabase!');
            console.log('📋 Saved data:', JSON.stringify(data, null, 2));
            return { success: true, data: data[0] };
        } catch (err) {
            console.error('💥 Exception in saveOrder:', err);
            console.error('💥 Error stack:', err.stack);
            return { success: false, error: err.message };
        }
    },

    // Get order by order number
    async getOrder(orderNumber) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select('*')
                .eq('order_number', orderNumber)
                .single();

            if (error) {
                console.error('Error fetching order:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err) {
            console.error('Error in getOrder:', err);
            return { success: false, error: err.message };
        }
    },

    // Update order status
    async updateOrderStatus(orderNumber, status) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .update({ 
                    status,
                    updated_at: new Date().toISOString()
                })
                .eq('order_number', orderNumber)
                .select();

            if (error) {
                console.error('Error updating order status:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data: data[0] };
        } catch (err) {
            console.error('Error in updateOrderStatus:', err);
            return { success: false, error: err.message };
        }
    },

    // Generate unique order number
    generateOrderNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 9000) + 1000;
        
        return `GO-${year}${month}${day}-${random}`;
    },

    // Prepare order data for database
    prepareOrderData(shippingInfo, paymentInfo, discountInfo = null) {
        const orderNumber = this.generateOrderNumber();
        const orderData = {
            order_number: orderNumber,
            // Customer info
            customer_email: shippingInfo.email,
            customer_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            customer_phone: shippingInfo.phone,
            
            // Shipping address
            shipping_address: {
                firstName: shippingInfo.firstName,
                lastName: shippingInfo.lastName,
                address: shippingInfo.address,
                city: shippingInfo.city,
                state: shippingInfo.state,
                zipCode: shippingInfo.zipCode,
                country: shippingInfo.country || 'US'
            },
            
            // Order details
            product_name: 'Go Offline - 256GB',
            base_price: 199.00,
            shipping_method: shippingInfo.shipping || 'standard',
            shipping_cost: shippingInfo.shipping === 'express' ? 15.00 : 7.00,
            
            // Discount info
            discount_code: discountInfo?.code || null,
            discount_amount: discountInfo?.amount || 0,
            discount_type: discountInfo?.type || null, // 'percentage' or 'fixed'
            
            // Payment info
            payment_method: 'stripe',
            stripe_session_id: paymentInfo?.sessionId || null,
            
            // Status and timestamps
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Calculate total
        let total = orderData.base_price + orderData.shipping_cost;
        if (discountInfo) {
            if (discountInfo.type === 'percentage') {
                total = total * (1 - discountInfo.amount / 100);
            } else if (discountInfo.type === 'fixed') {
                total = discountInfo.amount; // For fixed price discounts like $35
            } else {
                total = total - discountInfo.amount; // For fixed amount discounts
            }
        }
        orderData.total_amount = Math.max(total, 0);

        return orderData;
    },

    // Test database connection
    async testConnection() {
        console.log('🧪 Testing Supabase connection...');
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select('count(*)')
                .limit(1);
            
            if (error) {
                console.error('❌ Database connection test failed:', error);
                return { success: false, error: error.message };
            }
            
            console.log('✅ Database connection test successful');
            return { success: true };
        } catch (err) {
            console.error('💥 Exception in connection test:', err);
            return { success: false, error: err.message };
        }
    }
};

// Make OrderManager available globally
window.OrderManager = OrderManager;

// Test connection on load
document.addEventListener('DOMContentLoaded', async function() {
    if (window.OrderManager) {
        await window.OrderManager.testConnection();
    }
}); 