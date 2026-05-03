export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

// ── Dummy data ────────────────────────────────────────────────────────────────
const DUMMY = {
  creatorName:    'Jack',
  groupName:      "The Quinn Family",
  groupUrl:       'https://remify.app/group/preview000',
  verifyUrl:      'https://remify.app/api/verify/preview000',
  unsubscribeUrl: 'https://remify.app/unsubscribe/preview000',
  appUrl:         'https://remify.app',
  label:          "Mom's Birthday",
  type:           'birthday',
  month:          6,
  day:            15,
  year:           1960,
  note:           'She loves sunflowers',
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function typeEmoji(type: string) {
  const map: Record<string,string> = {
    birthday:'🎂', anniversary:'💍', graduation:'🎓',
    wedding:'💒', passing:'🕯️', other:'⭐',
  }
  return map[type] ?? '⭐'
}

function typeLabel(type: string) {
  const map: Record<string,string> = {
    birthday:'Birthday', anniversary:'Anniversary', graduation:'Graduation',
    wedding:'Wedding', passing:'Remembrance', other:'Special Date',
  }
  return map[type] ?? 'Special Date'
}

// ── Email builders ────────────────────────────────────────────────────────────
function verificationEmail() {
  const { creatorName, groupName, verifyUrl } = DUMMY
  return `
    <div class="label">1 — Group verification email (sent to creator)</div>
    <div class="email-wrap">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#3B0764;padding:32px 32px 24px;">
            <img src="https://remify.app/icon-email.png" width="40" height="40" alt="Remify" style="display:block;margin-bottom:16px;border-radius:10px;">
            <h1 style="margin:0 0 6px;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">Confirm your group</h1>
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:14px;">One click to activate <strong>${groupName}</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">Hi ${creatorName}, 👋</p>
            <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
              Click the button below to verify your email and activate your Remify group. This link expires in <strong>24 hours</strong>.
            </p>
            <a href="${verifyUrl}" style="display:inline-block;background:#3B0764;color:#ffffff;font-weight:600;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none;">
              Activate my group →
            </a>
            <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">
              If you didn't create a group on Remify, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">remify.app · Never miss what matters most</p>
          </td>
        </tr>
      </table>
    </div>`
}

function subscriberWelcomeEmail() {
  const { creatorName, groupName, groupUrl, unsubscribeUrl } = DUMMY
  return `
    <div class="label">2 — Subscriber welcome email (sent on "Email me" sign-up)</div>
    <div class="email-wrap">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#3B0764;padding:32px 32px 24px;">
            <img src="https://remify.app/icon-email.png" width="40" height="40" alt="Remify" style="display:block;margin-bottom:16px;border-radius:10px;">
            <h1 style="margin:0 0 6px;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">You're subscribed!</h1>
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:14px;">${groupName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">Hi ${creatorName}, 👋</p>
            <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
              You'll now receive email reminders for all important dates in <strong>${groupName}</strong> — 1 month, 10 days, and 1 day before each one.
            </p>
            <a href="${groupUrl}" style="display:inline-block;background:#3B0764;color:#ffffff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">
              View group dates →
            </a>
            <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">Bookmark this group link so you can always find it quickly.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
              You're receiving this because you subscribed to <strong>${groupName}</strong> reminders.<br>
              <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </div>`
}

function reminderEmail(daysAway: number) {
  const { creatorName, groupName, groupUrl, unsubscribeUrl, label, type, month, day, year, note } = DUMMY
  const dateStr = `${MONTHS[month - 1]} ${day}, ${year}`
  let countdown = ''
  if (daysAway === 1)  countdown = 'is <strong>tomorrow</strong>'
  else if (daysAway === 10) countdown = 'is <strong>10 days away</strong>'
  else countdown = 'is <strong>one month away</strong>'

  return `
    <div class="label">3 — Reminder email · ${daysAway === 1 ? '1 day' : daysAway === 10 ? '10 days' : '30 days'} variant</div>
    <div class="email-wrap">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#3B0764;padding:32px 32px 24px;">
            <p style="margin:0 0 12px;font-size:32px;line-height:1;">${typeEmoji(type)}</p>
            <h1 style="margin:0 0 6px;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">${label}</h1>
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:14px;">${typeLabel(type)} · ${dateStr}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">Hi ${creatorName}, 👋</p>
            <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">
              Just a reminder that <strong>${label}</strong> ${countdown}.
            </p>
            <div style="background:#faf5ff;border-left:3px solid #a82dd6;border-radius:4px;padding:12px 16px;margin:0 0 20px;">
              <p style="margin:0;color:#6b21a8;font-size:14px;font-style:italic;">"${note}"</p>
            </div>
            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">From <strong>${groupName}</strong></p>
            <a href="${groupUrl}" style="display:inline-block;background:#3B0764;color:#ffffff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">
              View all dates →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
              You're receiving this because you subscribed to <strong>${groupName}</strong> reminders.<br>
              <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </div>`
}

function findGroupsEmail() {
  const { groupName, appUrl } = DUMMY
  const dummyGroups = [
    { name: groupName, token: 'preview000' },
  ]
  const dummyFollowed = [
    { name: "Jack's Friends", token: 'preview001' },
  ]

  const groupRow = (g: { name: string; token: string }) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
        <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#111827;">${g.name}</p>
        <a href="${appUrl}/group/${g.token}" style="display:inline-block;background:#3B0764;color:#ffffff;font-size:13px;font-weight:600;padding:8px 18px;border-radius:8px;text-decoration:none;">
          Go to group →
        </a>
      </td>
    </tr>`

  return `
    <div class="label">4 — Find my groups email</div>
    <div class="email-wrap">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#3B0764;padding:32px 32px 24px;">
            <img src="https://remify.app/icon-email.png" width="40" height="40" alt="Remify" style="display:block;margin-bottom:16px;border-radius:10px;">
            <h1 style="margin:0 0 6px;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">Your Remify groups</h1>
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:14px;">Here are all the groups linked to your email</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Groups you created</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              ${dummyGroups.map(groupRow).join('')}
            </table>
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Groups you follow</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              ${dummyFollowed.map(groupRow).join('')}
            </table>
            <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">Bookmark your group link so you can always find it quickly.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">You received this because you requested it at remify.app</p>
          </td>
        </tr>
      </table>
    </div>`
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Remify — Email previews</title>
  <style>
    body { margin: 0; padding: 32px 16px; background: #f3f4f6; font-family: Inter, system-ui, sans-serif; }
    h1 { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 4px; }
    p.sub { font-size: 13px; color: #6b7280; margin: 0 0 40px; }
    .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 12px; }
    .email-wrap { margin-bottom: 48px; }
  </style>
</head>
<body>
  <h1>Remify — Email previews</h1>
  <p class="sub">Dummy data only. No emails sent. Refresh anytime.</p>
  ${verificationEmail()}
  ${subscriberWelcomeEmail()}
  ${reminderEmail(1)}
  ${reminderEmail(10)}
  ${reminderEmail(30)}
  ${findGroupsEmail()}
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  })
}
