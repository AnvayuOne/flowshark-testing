# Flowshark: suspected bugs found while reviewing (12 Nov 2026)

These come from the screenshots and from a read-only look at the dev.flowshark.ai demo workspace.
Nothing was clicked that changes data. Each item should be confirmed by a tester. The matching test case ID is shown in brackets.

## High: money and data accuracy
1. **Reference numbers are parsed as money.** The deal "proposal #54866620 — please review" is worth **$54,870,000**, so Place Onix "Total won" is $54.88M. That one deal inflates Won, Revenue generated, Win value, Projects and Won Handoff everywhere. *(TC-DEAL-015, TC-PROJ-012)*
2. **Invoices INV-0014 for $8,104,000 and INV-0013 for $6,078,000** are probably the same problem. They are sitting in the approval queue. *(TC-INV-011)*
3. **Open pipeline differs on every page:**
   - Today: $35,000
   - Dashboard: $115,505
   - Deals: $39,600
   - Clients: $35,000
   - Team Manager: $116k
   *(TC-XDATA-001)*
4. **Weighted forecast differs:** Today shows $20,500, Deals shows $23,500. *(TC-XDATA-002)*
5. **Win rate differs:** 84.6% on the Dashboard gauge, 85% in Pipeline overview, 79% on Deals. *(TC-XDATA-003)*
6. **Total deals differ:** 39 on Dashboard and Team Manager, 45 on Deals. *(TC-XDATA-004)*
7. **Dashboard Pipeline card says "+134465%"**, and the "Won $54.9M of $55.0M" bar is labelled **100%**. *(TC-DASH-002/003)*
8. **Invoices "In approval" card shows 0**, but 2 invoices are "Pending approval" and the Approvals page has 3 open. *(TC-INV-001, TC-XDATA-010)*
9. **Approvals "Total $ in queue" is written as "$14182k"** instead of $14.18M. *(TC-APPR-002)*
10. **The same PO number PO-US-9351 is attached to two clients** (Griet College and BluePeak Analytics). *(TC-PO-014)*
11. **Billing shows Starter plan with "Monthly credits 0"**, but the plan says it includes 500 per month. *(TC-BILL-001)*
12. **Email settings stats show "Deals won 0" and "Proposals sent 0"**, but the app shows 11 won deals and 4 proposals sent. *(TC-SET-021)*

## High: AI and classification
13. **Health page lists all 15 accounts as Healthy**, including Anvayu One with complaint language and 20% churn risk. Clients page says **9 are at risk**. *(TC-HEALTH-003/007)*
14. **Vendor and system domains are suggested as clients:** Microsoft, accountprotection.microsoft.com, Supabase. *(TC-CLIENT-004)*
15. **Inbox suggests "Gmail / gmail.com" as the company** for personal-email senders, even when the body names the company (ABC Technologies, NovaCare Hospitals). *(TC-INBOX-005)*
16. **The same reminder is created twice**: "Net 30 days… purchase order PDF…" appears twice, and the PO-US-9351 one appears twice too. Reminders still exist for a closed_lost deal. *(TC-REM-008/010)*
17. **Many leads are titled "Email opportunity / Email: (no subject)"** for the same sender. *(TC-LEAD-021)*

## Medium
18. **Members count differs:** 7 in Workspace health, 6 in Settings → Team, 4 in Team Manager. Gmail addresses are also listed as workspace members. *(TC-XDATA-007)*
19. **Today shows 4 hot leads; Leads page shows 3.** On Leads, Admin queue is 17 but total leads is only 15. Team Manager says 42 leads with 40 unassigned. *(TC-XDATA-005/006, TC-LEAD-002)*
20. **Agents shows "Completed 100% (23 of 23)"** while 1 mission is still waiting for approval. *(TC-AGENT-006)*
21. **Finn Worker is "Down" with 7 stuck jobs**, and one inbox needs "Watch". *(TC-DASH-014)*
22. **Raw internal IDs and status codes are shown to users:**
    - IDs such as `2@0f433337bed7:85` in Finn Rationale
    - "Invoice pending_approval" in project milestones
    - raw deal UUIDs in project descriptions
    - unformatted dates such as `2026-12-03T00:00:00Z` on invoices
    - unrounded credits/day `13.142857142857142`

    *(TC-DEAL-017, TC-PROJ-009, TC-INV-006, TC-DASH-013)*
23. **Project detail shows an empty "Client" label.** The project is still in KICKOFF even though its first milestone is already invoiced. *(TC-PROJ-004/008)*
24. **Sales ops pipeline preview shows "Closed Won" twice**, and its labels don't match the board. The page also says **"Backend wiring pending — config saved locally"**. *(TC-SET-026/027)*
25. **Email → Send test email says "No connected inboxes"** even though demo@flowshark.ai is Active. *(TC-SET-022)*
26. **Email sync options start at 15 minutes**, but the landing page promises a sync about every 10 minutes. The last sync was 9:00 AM, yet the next check is 2:45 PM. *(TC-SET-015/020)*
27. **Proposal cover page says "Prepared for / by / Date: Not specified"**, but the text below it has all three. *(TC-PROP-018)*
28. **Inconsistent badges:**
    - Sidebar Proposals badge shows 39; AI drafts card shows 41.
    - Sidebar Invoices badge shows 38; Finn drafts shows 59.

    *(TC-SHELL-002, TC-PROP-001)*
29. **Health group "Healthy (15)" uses a warning-triangle icon.** *(TC-HEALTH-002)*
30. **Some lead subjects contain HTML-like text** (`qa-test-< man i>…`). Test properly for escaping and XSS. *(TC-LEAD-020)*
31. **Settings → Team shows "Last active —"** for users who are active. *(TC-SET-010)*
