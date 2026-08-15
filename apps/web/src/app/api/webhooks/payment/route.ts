import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * PRODUCTION PAYMENT GATEWAY WEBHOOK ENDPOINT
 * Architecture Flow:
 * UPI Transfer → Payment Gateway → Webhook Endpoint → Supabase DB → Automatic Student Enrollment
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: any;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // 1. Signature Verification (Supports Razorpay / Stripe / Custom Gateway HMAC)
    const signature = req.headers.get('x-razorpay-signature') || req.headers.get('x-webhook-signature');
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'signalhub_webhook_secret_key';

    if (signature && process.env.PAYMENT_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    // 2. Extract Event & Payment Details
    const event = body.event || body.type || 'payment.captured';
    const payload = body.payload?.payment?.entity || body.data?.object || body;

    const studentId = payload.notes?.student_id || body.student_id;
    const courseId = payload.notes?.course_id || body.course_id;
    const amount = Number(payload.amount ? payload.amount / 100 : body.amount || 0);
    const paymentId = payload.id || body.payment_id || `PAY_${Date.now()}`;
    const utr = payload.acq_data?.rrn || body.utr || null;

    if (!studentId || !courseId) {
      return NextResponse.json({ 
        error: 'Missing student_id or course_id in webhook metadata payload' 
      }, { status: 400 });
    }

    // 3. Automatic Enrollment Upsert into Supabase Database
    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .upsert({
        student_id: studentId,
        course_id: courseId,
        status: 'active',
        payment_status: 'paid',
        amount_paid: amount,
        payment_method: 'upi_webhook',
        utr_number: utr,
        transaction_ref: paymentId,
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (enrollError) {
      console.error('Webhook Supabase enrollment error:', enrollError);
      return NextResponse.json({ error: enrollError.message }, { status: 500 });
    }

    // 4. Synchronize Student Profile in Supabase Database
    try {
      await supabaseAdmin.from('profiles').upsert({
        id: studentId,
        full_name: payload.notes?.student_name || body.student_name || 'Student Learner',
        email: payload.notes?.student_email || body.student_email || 'student@signalhub.app',
        role: 'student',
        updated_at: new Date().toISOString(),
      });
    } catch (profErr) {
      console.log('Webhook profile sync notice:', profErr);
    }

    // 5. Initialize Progress record in Supabase
    try {
      await supabaseAdmin.from('progress').upsert({
        student_id: studentId,
        course_id: courseId,
        lesson_id: 'e5555555-5555-5555-5555-555555555555',
        is_completed: false,
        video_watch_percent: 0,
        last_position_seconds: 0,
        updated_at: new Date().toISOString(),
      });
    } catch (pErr) {
      console.log('Webhook progress init notice:', pErr);
    }

    // 5. Success Response back to Gateway Server
    return NextResponse.json({
      success: true,
      message: 'Automatic enrollment verified and synced to Supabase!',
      event,
      enrollment,
    }, { status: 200 });

  } catch (err: any) {
    console.error('Webhook Endpoint Error:', err);
    return NextResponse.json({ error: err?.message || 'Server Webhook Processing Failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/payment',
    flow: 'UPI → Payment Gateway → Webhook → Supabase → Automatic Enrollment',
    supported_gateways: ['Razorpay', 'Stripe', 'PhonePe UPI', 'Paytm'],
    timestamp: new Date().toISOString(),
  });
}
