# Supabase Setup Instructions

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - Name: `vault-orders` (or any name you prefer)
   - Database Password: (use a strong password)
   - Region: Choose the closest to your users
5. Click "Create new project"

## 2. Set Up Database Schema

1. In your Supabase dashboard, go to the **SQL Editor**
2. Copy and paste the entire contents of `supabase-schema.sql`
3. Click **Run** to create the tables and policies

## 3. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. In `public/supabase-config.js`, replace:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your actual URL
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your anon key
   ```

## 4. Configure Row Level Security (Optional but Recommended)

The schema already includes basic RLS policies, but you may want to customize them:

1. Go to **Authentication** → **Policies** in your Supabase dashboard
2. Review the `orders` table policies
3. Modify as needed for your security requirements

## 5. Test the Integration

1. Go through your checkout process
2. Check the browser console for any errors
3. In Supabase, go to **Table Editor** → **orders** to see saved orders
4. Use the **order_summaries** view for a clean overview

## 6. Environment Variables (Production)

For production, consider storing credentials as environment variables:

```javascript
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-fallback-url';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-fallback-key';
```

## 7. Database Schema Overview

The `orders` table includes:

- **Customer Info**: email, name, phone
- **Shipping Address**: stored as JSON for flexibility
- **Product Details**: name, price, shipping method
- **Discount Info**: code, amount, type
- **Payment Info**: Stripe session ID, total amount
- **Order Status**: pending, paid, shipped, delivered
- **Timestamps**: created_at, updated_at (auto-managed)

## 8. Available Functions

The OrderManager provides these functions:

- `saveOrder(orderData)` - Save order to database
- `getOrder(orderNumber)` - Retrieve order by number
- `updateOrderStatus(orderNumber, status)` - Update order status
- `generateOrderNumber()` - Generate unique order number
- `prepareOrderData(shippingInfo, paymentInfo, discountInfo)` - Format data for database

## 9. Order Status Flow

1. **pending** - Order created, payment not confirmed
2. **paid** - Payment successful
3. **processing** - Order being prepared
4. **shipped** - Order dispatched with tracking
5. **delivered** - Order received by customer

## 10. Troubleshooting

**Common Issues:**

1. **CORS errors**: Make sure your domain is added to Supabase allowed origins
2. **RLS errors**: Check that policies allow your operations
3. **Connection errors**: Verify URL and API key are correct

**Debug Tips:**

- Check browser console for detailed error messages
- Use Supabase dashboard logs for server-side issues
- Test database operations directly in Supabase SQL editor

## 11. Security Best Practices

1. Never expose your service role key in frontend code
2. Use Row Level Security policies to protect data
3. Regularly rotate API keys
4. Monitor access logs in Supabase dashboard
5. Consider implementing user authentication for order access

## 12. Backup and Maintenance

1. Set up regular database backups in Supabase
2. Monitor database usage and upgrade plan if needed
3. Review and update RLS policies as your app grows
4. Keep the Supabase client library updated 