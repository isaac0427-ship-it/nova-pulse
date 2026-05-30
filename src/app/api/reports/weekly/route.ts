import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

const G = '#C6A15B'
const BG = '#0A0A0A'
const CARD = '#111111'
const BD = '#2A2A2A'
const TXT = '#F5F4F0'
const MUT = '#6B7A8D'

function weekLabel() {
  const d = new Date()
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function buildClientEmail(clientName: string, stats: {
  totalLeads: number
  answeredCalls: number
  missedCalls: number
  avgResponseMin: number
  converted: number
  revenueTracked: number
  biggestLeak: string
}) {
  const missedWarn = stats.missedCalls > 3 ? ' ⚠️' : ''
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:32px;">
      <div style="width:36px;height:36px;background:${G};display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:${BG};">N</div>
      <span style="font-size:18px;font-weight:700;color:${G};letter-spacing:0.1em;">NOVA SYSTEMS</span>
    </div>

    <h1 style="color:${TXT};font-size:24px;margin:0 0 8px 0;">Weekly Report</h1>
    <p style="color:${MUT};font-size:14px;margin:0 0 32px 0;">Week of ${weekLabel()} · ${clientName}</p>

    <p style="color:${TXT};font-size:15px;margin:0 0 24px 0;">Here's what happened with your leads this week:</p>

    <div style="background:${CARD};border:1px solid ${BD};padding:28px;margin-bottom:16px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BD};color:${MUT};font-size:13px;">Total Leads</td>
          <td style="padding:12px 0;border-bottom:1px solid ${BD};color:${TXT};font-size:16px;font-weight:700;text-align:right;">${stats.totalLeads}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BD};color:${MUT};font-size:13px;">Answered Calls</td>
          <td style="padding:12px 0;border-bottom:1px solid ${BD};color:${TXT};font-size:16px;font-weight:700;text-align:right;">${stats.answeredCalls}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BD};color:${MUT};font-size:13px;">Missed Calls${missedWarn}</td>
          <td style="padding:12px 0;border-bottom:1px solid ${BD};color:${stats.missedCalls > 3 ? '#EF4444' : TXT};font-size:16px;font-weight:700;text-align:right;">${stats.missedCalls}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BD};color:${MUT};font-size:13px;">Avg Response Time</td>
          <td style="padding:12px 0;border-bottom:1px solid ${BD};color:${TXT};font-size:16px;font-weight:700;text-align:right;">${stats.avgResponseMin}m</td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BD};color:${MUT};font-size:13px;">Leads Converted</td>
          <td style="padding:12px 0;border-bottom:1px solid ${BD};color:${TXT};font-size:16px;font-weight:700;text-align:right;">${stats.converted}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;color:${MUT};font-size:13px;">Revenue Tracked</td>
          <td style="padding:12px 0;color:${G};font-size:16px;font-weight:700;text-align:right;">$${stats.revenueTracked.toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);padding:20px;margin-bottom:32px;">
      <p style="color:#EF4444;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 8px 0;">BIGGEST LEAK THIS WEEK</p>
      <p style="color:${TXT};font-size:14px;margin:0;line-height:1.6;">${stats.biggestLeak}</p>
    </div>

    <p style="color:${MUT};font-size:13px;line-height:1.7;margin:0 0 32px 0;">
      Questions? Reply to this email and we'll get back to you within 24 hours.
    </p>

    <div style="border-top:1px solid ${BD};padding-top:24px;">
      <p style="color:#333;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin:0;">
        © NOVA SYSTEMS · ALL RIGHTS RESERVED
      </p>
    </div>
  </div>
</body>
</html>`
}

function computeLeak(stats: { missedCalls: number; totalLeads: number; avgResponseMin: number; converted: number }): string {
  if (stats.missedCalls > 3) {
    return `${stats.missedCalls} calls went unanswered this week. Each missed call is a lead going to a competitor. Your fastest fix: make sure your phone is always forwarded and Nova notifications are on.`
  }
  if (stats.avgResponseMin > 60) {
    return `Average response time was ${stats.avgResponseMin} minutes. After 5 minutes, conversion drops 80%. Leads are going cold before you call back.`
  }
  if (stats.totalLeads > 0 && stats.converted === 0) {
    return `You received ${stats.totalLeads} leads but converted 0 this week. Review each lead in your dashboard and make sure follow-ups are happening within the hour.`
  }
  return `Operations look healthy this week. Keep response times under 5 minutes and answer every call to maximize revenue.`
}

export async function POST(_req: NextRequest) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, email, avg_customer_value')
      .eq('status', 'active')

    if (!clients || clients.length === 0) {
      return NextResponse.json({ ok: true, message: 'No active clients' })
    }

    const summaryRows: string[] = []

    for (const client of clients) {
      const [leadsRes, callsRes] = await Promise.all([
        supabase.from('leads').select('*').eq('client_id', client.id).gte('lead_in_at', sevenDaysAgo),
        supabase.from('calls').select('*').eq('client_id', client.id).gte('called_at', sevenDaysAgo)
      ])

      const leads = leadsRes.data ?? []
      const calls = callsRes.data ?? []

      const totalLeads = leads.length
      const missedCalls = calls.filter(c => c.status === 'missed').length
      const answeredCalls = calls.filter(c => c.status === 'completed').length
      const converted = leads.filter(l => l.status === 'converted' || l.status === 'closed').length

      const responseTimes = leads
        .filter(l => l.response_time_minutes != null)
        .map(l => l.response_time_minutes as number)
      const avgResponseMin = responseTimes.length
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0

      const avgValue = client.avg_customer_value || 0
      const revenueTracked = converted * avgValue

      const stats = { totalLeads, answeredCalls, missedCalls, avgResponseMin, converted, revenueTracked, biggestLeak: '' }
      stats.biggestLeak = computeLeak(stats)

      if (client.email) {
        await resend.emails.send({
          from: 'Nova Systems <reports@nova-systems.app>',
          to: client.email,
          subject: `Your Nova Systems Weekly Report — Week of ${weekLabel()}`,
          html: buildClientEmail(client.name, stats)
        })
      }

      summaryRows.push(`${client.name}: ${totalLeads} leads, ${missedCalls} missed, ${converted} converted, $${revenueTracked.toLocaleString()} tracked`)
    }

    await resend.emails.send({
      from: 'Nova Systems <reports@nova-systems.app>',
      to: 'isaac_0427@icloud.com',
      subject: `NOVA: Weekly Report Summary — ${clients.length} clients — Week of ${weekLabel()}`,
      html: `<!DOCTYPE html>
<html><body style="font-family:sans-serif;background:#0A0A0A;color:#F5F4F0;padding:32px;">
  <h2 style="color:#C6A15B;">Weekly Summary — All Clients</h2>
  <p style="color:#6B7A8D;">Week of ${weekLabel()}</p>
  <table style="width:100%;border-collapse:collapse;margin-top:24px;">
    <tr style="border-bottom:1px solid #2A2A2A;">
      <th style="text-align:left;padding:10px;color:#6B7A8D;font-size:12px;">CLIENT</th>
      <th style="text-align:left;padding:10px;color:#6B7A8D;font-size:12px;">SUMMARY</th>
    </tr>
    ${summaryRows.map(r => {
      const [name, rest] = r.split(': ')
      return `<tr style="border-bottom:1px solid #1A1A1A;">
        <td style="padding:10px;color:#C6A15B;font-size:13px;font-weight:700;">${name}</td>
        <td style="padding:10px;color:#F5F4F0;font-size:13px;">${rest}</td>
      </tr>`
    }).join('')}
  </table>
  <p style="margin-top:32px;"><a href="https://nova-systems.app/master" style="color:#C6A15B;">Open Master Dashboard →</a></p>
</body></html>`
    })

    return NextResponse.json({ ok: true, clients_reported: clients.length, summary: summaryRows })

  } catch (err) {
    console.error('Weekly report error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
