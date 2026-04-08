function fmtCurrency(n) {
  return `&#8377;${(n || 0).toLocaleString('en-IN')}`;
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderProposalHtml(proposal, options = {}) {
  const subtotal = (proposal.lineItems || []).reduce((sum, li) => sum + ((li.quantity || 0) * (li.unitPrice || 0)), 0);
  let discountAmount = 0;
  if (proposal.discountType === 'percentage') discountAmount = subtotal * (proposal.discountValue / 100);
  else if (proposal.discountType === 'fixed') discountAmount = proposal.discountValue || 0;
  const total = Math.max(0, subtotal - discountAmount);

  const clientName = proposal.client?.company || proposal.lead?.company || proposal.lead?.contactName || 'Client';
  const trackingPixel = options.trackingId
    ? `<img src="${options.baseUrl}/api/v1/track/proposal/${options.trackingId}.gif" width="1" height="1" alt="" style="display:block" />`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(proposal.title)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: #1e293b;
    line-height: 1.5;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .container { max-width: 800px; margin: 0 auto; padding: 40px; }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #6366f1;
    padding-bottom: 24px;
    margin-bottom: 32px;
  }
  .logo {
    font-size: 28px;
    font-weight: 700;
    color: #6366f1;
    letter-spacing: -0.5px;
  }
  .firm-info { font-size: 11px; color: #64748b; line-height: 1.6; }
  .doc-info { text-align: right; }
  .doc-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
  .doc-number { font-size: 14px; font-weight: 600; color: #475569; margin-top: 4px; }
  .doc-date { font-size: 11px; color: #64748b; margin-top: 4px; }
  h1 { font-size: 26px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.5px; }
  .meta-row {
    display: flex;
    gap: 32px;
    margin-bottom: 32px;
    padding: 16px 20px;
    background: #f8fafc;
    border-radius: 8px;
  }
  .meta-block { flex: 1; }
  .meta-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 4px; }
  .meta-value { font-size: 12px; color: #334155; font-weight: 500; }
  .summary {
    font-size: 13px;
    color: #475569;
    line-height: 1.7;
    margin-bottom: 28px;
    white-space: pre-wrap;
  }
  h2 {
    font-size: 13px;
    font-weight: 600;
    color: #6366f1;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 32px 0 12px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
  }
  table { width: 100%; border-collapse: collapse; }
  th {
    text-align: left;
    font-size: 10px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 12px 8px;
    border-bottom: 2px solid #e2e8f0;
    font-weight: 600;
  }
  th.right { text-align: right; }
  td { padding: 14px 8px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #334155; }
  td.right { text-align: right; font-variant-numeric: tabular-nums; }
  td.bold { font-weight: 600; }
  .item-desc { color: #1e293b; font-weight: 500; }
  .item-type {
    display: inline-block;
    font-size: 9px;
    background: #ede9fe;
    color: #6d28d9;
    padding: 2px 6px;
    border-radius: 3px;
    margin-left: 6px;
    text-transform: uppercase;
    font-weight: 600;
  }
  .totals {
    margin-top: 16px;
    margin-left: auto;
    width: 300px;
  }
  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 12px;
    color: #475569;
  }
  .totals-row.discount { color: #dc2626; }
  .totals-row.grand-total {
    font-size: 16px;
    font-weight: 700;
    color: #059669;
    border-top: 2px solid #e2e8f0;
    margin-top: 8px;
    padding-top: 12px;
  }
  .terms-list { padding-left: 20px; font-size: 12px; color: #475569; line-height: 1.8; }
  .notes-block {
    margin-top: 20px;
    padding: 16px 20px;
    background: #f8fafc;
    border-left: 3px solid #6366f1;
    border-radius: 4px;
    font-size: 12px;
    color: #475569;
    line-height: 1.7;
    white-space: pre-wrap;
  }
  .footer {
    margin-top: 48px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
    text-align: center;
    font-size: 10px;
    color: #94a3b8;
  }
  .validity {
    margin-top: 16px;
    padding: 10px 16px;
    background: #fef3c7;
    border-radius: 6px;
    font-size: 11px;
    color: #92400e;
    text-align: center;
  }
</style>
</head>
<body>
<div class="container">

  <div class="header">
    <div>
      <div class="logo">AIB Innovations</div>
      <div class="firm-info">
        Project Management & Consulting<br/>
        contact@aibinnovations.com
      </div>
    </div>
    <div class="doc-info">
      <div class="doc-label">Proposal</div>
      <div class="doc-number">${escapeHtml(proposal.proposalNumber)}</div>
      <div class="doc-date">${fmtDate(new Date())}</div>
      <div class="doc-date">Version ${proposal.version}</div>
    </div>
  </div>

  <h1>${escapeHtml(proposal.title)}</h1>

  <div class="meta-row">
    <div class="meta-block">
      <div class="meta-label">Prepared For</div>
      <div class="meta-value">${escapeHtml(clientName)}</div>
    </div>
    ${proposal.validityDate ? `
    <div class="meta-block">
      <div class="meta-label">Valid Until</div>
      <div class="meta-value">${fmtDate(proposal.validityDate)}</div>
    </div>` : ''}
  </div>

  ${proposal.summary ? `<div class="summary">${escapeHtml(proposal.summary)}</div>` : ''}

  ${(proposal.lineItems || []).length > 0 ? `
  <h2>Scope &amp; Pricing</h2>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="right">Qty</th>
        <th class="right">Unit Price</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${proposal.lineItems.map((li) => `
        <tr>
          <td class="item-desc">
            ${escapeHtml(li.description)}
            ${li.type === 'recurring' ? '<span class="item-type">Recurring</span>' : ''}
          </td>
          <td class="right">${li.quantity}</td>
          <td class="right">${fmtCurrency(li.unitPrice)}</td>
          <td class="right bold">${fmtCurrency((li.quantity || 0) * (li.unitPrice || 0))}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal</span>
      <span>${fmtCurrency(subtotal)}</span>
    </div>
    ${discountAmount > 0 ? `
    <div class="totals-row discount">
      <span>Discount${proposal.discountType === 'percentage' ? ` (${proposal.discountValue}%)` : ''}</span>
      <span>-${fmtCurrency(discountAmount)}</span>
    </div>` : ''}
    <div class="totals-row grand-total">
      <span>Total</span>
      <span>${fmtCurrency(total)}</span>
    </div>
  </div>
  ` : ''}

  ${(proposal.paymentTerms || []).length > 0 ? `
  <h2>Payment Terms</h2>
  <ul class="terms-list">
    ${proposal.paymentTerms.map((m) => `
      <li><strong>${escapeHtml(m.label)}</strong>${m.percentage ? ` &mdash; ${m.percentage}%` : ''}${m.dueOn ? ` (${escapeHtml(m.dueOn)})` : ''}</li>
    `).join('')}
  </ul>
  ` : ''}

  ${proposal.notes ? `
  <h2>Terms &amp; Notes</h2>
  <div class="notes-block">${escapeHtml(proposal.notes)}</div>
  ` : ''}

  ${proposal.validityDate ? `
  <div class="validity">
    This proposal is valid until ${fmtDate(proposal.validityDate)}
  </div>` : ''}

  <div class="footer">
    Generated by PMS &middot; ${escapeHtml(proposal.proposalNumber)} &middot; Page 1
  </div>

</div>
${trackingPixel}
</body>
</html>
  `;
}
