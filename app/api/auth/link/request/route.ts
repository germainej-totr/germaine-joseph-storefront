import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { shopifyAdminGraphQL } from '@/lib/shopify';
import {
  applyEmailLinkChallengeCookie,
  createEmailLinkChallenge,
} from '@/lib/session';

const resend = new Resend(process.env.RESEND_API_KEY);

const BODY_SCHEMA = z.object({
  email: z.string().email(),
});

const CUSTOMER_BY_EMAIL_QUERY = `
  query CustomerByEmail($query: String!) {
    customers(first: 1, query: $query) {
      edges {
        node {
          id
          email
          firstName
          lastName
        }
      }
    }
  }
`;

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const body = BODY_SCHEMA.parse(await request.json());
    const email = body.email.trim().toLowerCase();

    const data = await shopifyAdminGraphQL(CUSTOMER_BY_EMAIL_QUERY, {
      query: `email:${email}`,
    });

    const graphqlErrors = data?.errors;
    if (Array.isArray(graphqlErrors) && graphqlErrors.length > 0) {
      const accessDenied = graphqlErrors.some((err: unknown) => {
        if (!err || typeof err !== 'object') return false;
        const extensions = (err as { extensions?: { code?: string } }).extensions;
        return extensions?.code === 'ACCESS_DENIED';
      });

      if (accessDenied) {
        return NextResponse.json(
          {
            ok: false,
            error: 'customer_lookup_access_denied',
            hint: 'Admin API token needs customer access scope/permissions.',
          },
          { status: 403 },
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: 'customer_lookup_failed',
          details: graphqlErrors,
        },
        { status: 502 },
      );
    }

    const customer = data?.data?.customers?.edges?.[0]?.node;
    if (!customer || String(customer.email).toLowerCase() !== email) {
      return NextResponse.json({ ok: false, error: 'customer_not_found' }, { status: 404 });
    }

    const missingEnv: string[] = [];
    if (!process.env.RESEND_API_KEY) missingEnv.push('RESEND_API_KEY');
    if (!process.env.RESEND_FROM) missingEnv.push('RESEND_FROM');

    if (missingEnv.length) {
      return NextResponse.json(
        { ok: false, error: 'email_not_configured', missingEnv },
        { status: 503 },
      );
    }

    const code = generateCode();
    const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() || 'there';

    const sendResult = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: email,
      subject: 'Your Tailor On The Road sign-in code',
      html: `
        <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
          <p>Hello ${fullName},</p>
          <p>Use the code below to finish signing in to Tailor On The Road:</p>
          <p style="font-size: 32px; font-weight: 700; letter-spacing: 0.24em; margin: 24px 0;">${code}</p>
          <p>This code expires in 10 minutes.</p>
        </div>
      `,
    });

    if (sendResult.error) {
      return NextResponse.json({ ok: false, error: sendResult.error.message }, { status: 502 });
    }

    const response = NextResponse.json({ ok: true });
    applyEmailLinkChallengeCookie(
      response,
      createEmailLinkChallenge({
        email,
        customerGid: customer.id,
        code,
      }),
    );

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}