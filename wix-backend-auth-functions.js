// ═══════════════════════════════════════════════════════════════════
// ADD THESE FUNCTIONS TO YOUR WIX SITE'S backend/http-functions.js
// (alongside the existing memberDashboard and createCheckoutSession)
// ═══════════════════════════════════════════════════════════════════

import { authentication } from 'wix-members-backend';
import { members } from 'wix-members.v2';
import { ok, badRequest, serverError, response } from 'wix-http-functions';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://app.marmaroph.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

// Handle CORS preflight for socialLogin
export function options_socialLogin(request) {
  return response({ status: 204, headers: corsHeaders() });
}

// POST _functions/socialLogin
// Body: { provider: 'google', token: string }
// Uses Google access token to get user profile, then finds member by email.
export async function post_socialLogin(request) {
  try {
    const body = await request.body.json();
    const { provider, token } = body;

    if (!token || provider !== 'google') {
      return badRequest({
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Invalid login request.' })
      });
    }

    // Get user info from Google using the access token
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: 'Bearer ' + token }
    });

    if (!googleRes.ok) {
      return badRequest({
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Google authentication failed. Please try again.' })
      });
    }

    const googleUser = await googleRes.json();
    const email = (googleUser.email || '').toLowerCase();

    if (!email) {
      return badRequest({
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Could not retrieve email from Google.' })
      });
    }

    // Look up member by email
    const result = await members.queryMembers()
      .eq('loginEmail', email)
      .find({ suppressAuth: true });

    if (result.items.length === 0) {
      return badRequest({
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'No account found for ' + email + '. Please sign up first or use the email you registered with.' })
      });
    }

    const member = result.items[0];
    return ok({
      headers: corsHeaders(),
      body: JSON.stringify({
        memberId: member._id,
        loginEmail: member.loginEmail || email,
        firstName: member.profile?.firstName || googleUser.given_name || '',
        lastName: member.profile?.lastName || googleUser.family_name || '',
        nickname: member.profile?.nickname || '',
        photo: member.profile?.photo?.url || googleUser.picture || '',
        slug: member.slug || ''
      })
    });
  } catch (err) {
    return serverError({
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Login failed. Please try again.' })
    });
  }
}

// Handle CORS preflight for loginMember
export function options_loginMember(request) {
  return response({ status: 204, headers: corsHeaders() });
}

// Handle CORS preflight for registerMember
export function options_registerMember(request) {
  return response({ status: 204, headers: corsHeaders() });
}

// POST _functions/loginMember
// Body: { email: string, password: string }
// Returns: { memberId, loginEmail, firstName, lastName, nickname, photo, slug }
export async function post_loginMember(request) {
  try {
    const body = await request.body.json();
    const { email, password } = body;

    if (!email || !password) {
      return badRequest({
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Email and password are required.' })
      });
    }

    // Verify credentials — throws if invalid
    const sessionToken = await authentication.login(email, password);

    // Look up member by email to get full profile
    const result = await members.queryMembers()
      .eq('loginEmail', email.toLowerCase())
      .find({ suppressAuth: true });

    if (result.items.length === 0) {
      return badRequest({
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Member not found.' })
      });
    }

    const member = result.items[0];
    return ok({
      headers: corsHeaders(),
      body: JSON.stringify({
        memberId: member._id,
        loginEmail: member.loginEmail || email,
        firstName: member.profile?.firstName || '',
        lastName: member.profile?.lastName || '',
        nickname: member.profile?.nickname || '',
        photo: member.profile?.photo?.url || '',
        slug: member.slug || ''
      })
    });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('Invalid') || msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
      return badRequest({
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Invalid email or password.' })
      });
    }
    return serverError({
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Login failed. Please try again.' })
    });
  }
}

// POST _functions/registerMember
// Body: { email: string, password: string, firstName?: string, lastName?: string }
// Returns: { memberId, loginEmail, firstName, lastName, status }
export async function post_registerMember(request) {
  try {
    const body = await request.body.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password) {
      return badRequest({
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Email and password are required.' })
      });
    }

    if (password.length < 6) {
      return badRequest({
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Password must be at least 6 characters.' })
      });
    }

    const result = await authentication.register(email, password, {
      contact: {
        firstName: firstName || '',
        lastName: lastName || ''
      }
    });

    return ok({
      headers: corsHeaders(),
      body: JSON.stringify({
        memberId: result.member._id,
        loginEmail: email,
        firstName: firstName || '',
        lastName: lastName || '',
        nickname: '',
        photo: '',
        slug: '',
        status: result.status
      })
    });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('existing')) {
      return badRequest({
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'An account with this email already exists. Please log in instead.' })
      });
    }
    return serverError({
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Registration failed. Please try again.' })
    });
  }
}
