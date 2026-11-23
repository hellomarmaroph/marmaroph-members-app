// ─── Wix Velo Backend: createCheckoutSession ───
// This is the code that needs to be on your Wix site's backend (http-functions.js or a separate module).
// It handles the `two_weeks_free` promoType by adding trial_period_days: 14 to the Stripe subscription.
//
// IMPORTANT: Copy the relevant `two_weeks_free` handling into your existing createCheckoutSession
// function on the live Wix site at https://www.marmaroph.com/_functions/createCheckoutSession

import { ok, serverError } from 'wix-http-functions';
import { getSecret } from 'wix-secrets-backend';

export async function post_createCheckoutSession(request) {
  try {
    const body = await request.body.json();
    const stripeSecretKey = await getSecret("STRIPE_SECRET_KEY");

    const {
      memberId, email, ritual, ritualName,
      addProduct, anchorObject, anchorPrice,
      shipName, birthDate, clientCountry, whatsappNumber,
      isGift, giftEmail, giftName, giftMessage,
      collectionName, customText,
      promoCode, promoType, promoDiscountPercent
    } = body;

    // Build line items
    const lineItems = [];

    // Subscription line item (the ritual)
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: ritualName || 'Marmaroph Wellness Ritual',
          metadata: { ritual, memberId }
        },
        unit_amount: 2900, // $29.00
        recurring: { interval: 'month' }
      },
      quantity: 1
    });

    // Add anchor product if selected
    if (addProduct && anchorObject && anchorPrice > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: anchorObject,
            metadata: { collectionName, customText }
          },
          unit_amount: Math.round(anchorPrice * 100)
        },
        quantity: 1
      });
    }

    // Build subscription_data
    const subscriptionData = {
      metadata: {
        memberId,
        ritual,
        ritualName: ritualName || '',
        promoCode: promoCode || '',
        promoType: promoType || ''
      }
    };

    // ═══ HANDLE PROMO TYPES ═══
    const sessionParams = {
      mode: 'subscription',
      customer_email: email,
      line_items: lineItems,
      subscription_data: subscriptionData,
      success_url: `https://app.marmaroph.com/checkout.html?success=true&memberId=${memberId}`,
      cancel_url: `https://app.marmaroph.com/checkout.html?memberId=${memberId}`,
      metadata: { memberId, ritual, shipName, birthDate, clientCountry, whatsappNumber }
    };

    if (promoType === 'two_weeks_free') {
      // ══════════════════════════════════════════════════
      // FREE 2-WEEK TRIAL: No coupon needed, just trial days
      // The customer gets 14 days free, then billing starts
      // ══════════════════════════════════════════════════
      sessionParams.subscription_data.trial_period_days = 14;

    } else if (promoType === 'forever_free') {
      // Founding member: 100% off forever
      // Apply the coupon to the subscription
      sessionParams.discounts = [{ coupon: promoCode }];

    } else if (promoCode && promoDiscountPercent > 0) {
      // Other promo codes with discount
      sessionParams.discounts = [{ coupon: promoCode }];
    }

    // Gift handling
    if (isGift) {
      sessionParams.metadata.isGift = 'true';
      sessionParams.metadata.giftEmail = giftEmail || '';
      sessionParams.metadata.giftName = giftName || '';
      sessionParams.metadata.giftMessage = giftMessage || '';
    }

    // Create Stripe checkout session
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: buildFormBody(sessionParams)
    });

    const session = await response.json();

    if (session.error) {
      return serverError({ body: { error: session.error.message } });
    }

    return ok({ body: { sessionId: session.id, url: session.url } });

  } catch (err) {
    return serverError({ body: { error: err.message } });
  }
}

// Helper: Convert nested object to Stripe's form-encoded format
function buildFormBody(obj, prefix = '') {
  const parts = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === 'object') {
          parts.push(buildFormBody(item, `${fullKey}[${i}]`));
        } else {
          parts.push(`${encodeURIComponent(`${fullKey}[${i}]`)}=${encodeURIComponent(item)}`);
        }
      });
    } else if (typeof value === 'object') {
      parts.push(buildFormBody(value, fullKey));
    } else {
      parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.filter(Boolean).join('&');
}
