// Pure calculation functions for the Pricing Tool. No side effects, no DB calls.
// Shared between the UI (live preview) and could be reused server-side later.

export function calcStudioDerived(config) {
  const founderDrawsTotal = Object.values(config.founder_draws || {}).reduce((a, b) => a + Number(b), 0)
  const fixedCostsTotal = (config.fixed_costs || []).reduce((a, c) => a + Number(c.amount), 0)
  const retainersTotal = (config.freelancer_retainers || []).reduce((a, c) => a + Number(c.amount), 0)

  const totalMonthlyCost = founderDrawsTotal + fixedCostsTotal + retainersTotal
  const monthlyBreakeven = totalMonthlyCost
  const totalPersonDays = config.working_days_per_month * config.billable_founders
  const dailyBreakevenPerPerson = totalPersonDays > 0 ? monthlyBreakeven / totalPersonDays : 0
  const hourlyBreakevenPerPerson = config.working_hours_per_day > 0
    ? dailyBreakevenPerPerson / config.working_hours_per_day : 0

  const targetMarginDecimal = (config.target_margin_percent || 0) / 100
  const monthlyRevenueNeeded = targetMarginDecimal < 1
    ? monthlyBreakeven / (1 - targetMarginDecimal)
    : 0

  const stretchAlert = monthlyRevenueNeeded > 2 * monthlyBreakeven

  return {
    founderDrawsTotal,
    fixedCostsTotal,
    retainersTotal,
    totalMonthlyCost,
    monthlyBreakeven,
    dailyBreakevenPerPerson,
    hourlyBreakevenPerPerson,
    monthlyRevenueNeeded,
    stretchAlert,
  }
}

export function calcClientProfile(profile, config) {
  const SIZE_TO_TIER = {
    bootstrapped: 'bootstrapped',
    seed: 'funded',
    series_a_plus: 'funded',
    established: 'established',
    enterprise: 'enterprise',
    international: 'international',
  }

  const tierKey = SIZE_TO_TIER[profile.client_size] || 'bootstrapped'
  const dayRate = (config.rate_tiers || {})[tierKey] || 0

  let flags = 0
  if (profile.decision_maker !== 'yes') flags++
  if (profile.budget_range === 'not_disclosed') flags++
  if (profile.client_size === 'bootstrapped') flags++

  const riskScore = flags >= 3 ? 'High' : flags >= 1 ? 'Medium' : 'Low'

  const highBudget = ['7_15l', '15l_plus'].includes(profile.budget_range)
  const establishedOrAbove = ['established', 'enterprise'].includes(profile.client_size)
  const suggestedEngagement = (highBudget && establishedOrAbove) ? 'Retainer' : 'Project'

  const rushApplied = profile.rush_project === 'yes'

  return {
    tierKey,
    dayRate,
    riskScore,
    suggestedEngagement,
    rushApplied,
    rushPremiumPercent: config.rush_premium_percent || 25,
    findersFeePercent: Number(profile.finders_fee_percent || 0),
  }
}

export const DELIVERABLES = [
  { key: 'discovery', label: 'Discovery and brief alignment', defaultDays: 1 },
  { key: 'brand_strategy', label: 'Brand strategy document', defaultDays: 4 },
  { key: 'naming', label: 'Naming', defaultDays: 3 },
  { key: 'logo_system', label: 'Logo system (primary + variations)', defaultDays: 4 },
  { key: 'color_type', label: 'Colour and typography system', defaultDays: 1.5 },
  { key: 'brand_guidelines', label: 'Brand guidelines document', defaultDays: 3 },
  { key: 'stationery', label: 'Stationery and collateral', defaultDays: 2 },
  { key: 'social_templates', label: 'Social media templates', defaultDays: 2 },
  { key: 'motion_logo', label: 'Motion logo / brand animation', defaultDays: 2 },
  { key: 'explainer_video', label: 'Explainer video (60 sec)', defaultDays: 8 },
  { key: 'reels', label: 'Reels / short form content', defaultDays: 1.5, perUnit: true, unitLabel: 'reel' },
  { key: 'website_design', label: 'Website design', defaultDays: 0.75, perUnit: true, unitLabel: 'page' },
  { key: 'website_dev', label: 'Website development', defaultDays: 0 },
  { key: 'shopify', label: 'Shopify setup', defaultDays: 3 },
  { key: 'pitch_deck', label: 'Pitch deck', defaultDays: 2.5 },
  { key: 'copywriting', label: 'Copywriting', defaultDays: 2 },
  { key: 'photography', label: 'Photography / asset sourcing', defaultDays: 1 },
  { key: 'campaign', label: 'Campaign', defaultDays: 0 },
  { key: 'packaging', label: 'Packaging', defaultDays: 0 },
  { key: 'presentation_design', label: 'Presentation design', defaultDays: 0 },
]

export function calcScope(scope, dayRate, hoursPerDay = 8) {
  let totalDays = 0
  const included = []
  const addedKeys = new Set()

  for (const item of (scope.added_deliverables || [])) {
    const qty = item.perUnit ? Number(item.quantity || 1) : 1
    const rawTime = Number(item.timeValue ?? item.days ?? 0)
    const itemDays = item.timeUnit === 'hours' ? (rawTime / hoursPerDay) : rawTime
    const days = itemDays * qty
    totalDays += days
    const timeLabel = item.timeUnit === 'hours'
      ? `${rawTime} hr${rawTime !== 1 ? 's' : ''}${qty > 1 ? ` × ${qty}` : ''}`
      : `${days} day${days !== 1 ? 's' : ''}`
    included.push({ label: item.label, days, qty: item.perUnit ? qty : null, timeLabel })
    addedKeys.add(item.key)
  }

  // Excluded = built-in deliverables not in the added list
  const excluded = DELIVERABLES.filter(d => !addedKeys.has(d.key)).map(d => d.label)

  const totalHours = totalDays * 8

  const thirdPartyCostsTotal = (scope.third_party_items || [])
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const basePriceForContingency = totalDays * dayRate
  const contingencyPercent = Number(scope.contingency_percent || 10)
  const contingencyAmount = basePriceForContingency * (contingencyPercent / 100)

  return {
    totalDays,
    totalHours,
    included,
    excluded,
    thirdPartyCostsTotal,
    contingencyPercent,
    contingencyAmount,
  }
}

export function calcPricing({ scopeResult, clientProfile, config, extraRevisionRounds = 0 }) {
  const { totalDays } = scopeResult
  const dayRate = clientProfile.dayRate
  const foundersOnProject = Number(scopeResult.foundersOnProject || 1)
  const hourlyBreakeven = config.derived?.hourlyBreakevenPerPerson || 0
  const workingHoursPerDay = config.working_hours_per_day || 8
  const passthroughMarkup = (config.passthrough_markup_percent || 15) / 100

  const baseProjectCostInternal = totalDays * foundersOnProject * workingHoursPerDay * hourlyBreakeven
  const baseProjectPrice = totalDays * dayRate

  const rushPremium = clientProfile.rushApplied
    ? baseProjectPrice * (clientProfile.rushPremiumPercent / 100)
    : 0

  const freelancerPassthrough = (scopeResult.freelancerCost || 0) * (1 + passthroughMarkup)
  const thirdPartyPassthrough = scopeResult.thirdPartyCostsTotal * (1 + passthroughMarkup)
  const passthroughTotal = freelancerPassthrough + thirdPartyPassthrough

  const contingencyAmount = scopeResult.contingencyAmount

  const totalProjectValueExGst = baseProjectPrice + rushPremium + passthroughTotal + contingencyAmount

  const gstAmount = totalProjectValueExGst * 0.18
  const totalPayableIncGst = totalProjectValueExGst + gstAmount
  const tdsAmount = totalProjectValueExGst * 0.10
  const actualCashReceived = totalPayableIncGst - tdsAmount

  const priceableRevenue = baseProjectPrice + rushPremium
  const grossMarginPercent = priceableRevenue > 0
    ? ((priceableRevenue - baseProjectCostInternal) / priceableRevenue) * 100
    : 0

  const totalPersonHours = totalDays * foundersOnProject * workingHoursPerDay
  const effectiveHourlyRate = totalPersonHours > 0 ? priceableRevenue / totalPersonHours : 0

  const redThreshold = config.margin_red_threshold || 40
  const greenThreshold = config.margin_green_threshold || 50
  const marginStatus = grossMarginPercent < redThreshold ? 'red'
    : grossMarginPercent < greenThreshold ? 'amber' : 'green'

  const floorPrice = redThreshold < 100
    ? baseProjectCostInternal / (1 - redThreshold / 100)
    : baseProjectCostInternal
  const recommendedPrice = totalProjectValueExGst
  const stretchPrice = recommendedPrice * 1.2

  const daysPerRevisionRound = Number(scopeResult.daysPerRevisionRound || 1)
  const additionalRevisionRoundCost = daysPerRevisionRound * dayRate
  const extraRevisionCostTotal = additionalRevisionRoundCost * extraRevisionRounds

  const findersFeePercent = clientProfile.findersFeePercent || 0
  const findersFeeAmount = findersFeePercent > 0
    ? totalProjectValueExGst * (findersFeePercent / 100)
    : 0
  const netAfterFindersFee = actualCashReceived - findersFeeAmount

  const round100 = n => Math.round(n / 100) * 100

  return {
    baseProjectCostInternal: round100(baseProjectCostInternal),
    baseProjectPrice: round100(baseProjectPrice),
    rushPremium: round100(rushPremium),
    freelancerPassthrough: round100(freelancerPassthrough),
    thirdPartyPassthrough: round100(thirdPartyPassthrough),
    passthroughTotal: round100(passthroughTotal),
    contingencyAmount: round100(contingencyAmount),
    totalProjectValueExGst: round100(totalProjectValueExGst),
    gstAmount: round100(gstAmount),
    totalPayableIncGst: round100(totalPayableIncGst),
    tdsAmount: round100(tdsAmount),
    actualCashReceived: round100(actualCashReceived),
    grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
    effectiveHourlyRate: round100(effectiveHourlyRate),
    marginStatus,
    floorPrice: round100(floorPrice),
    recommendedPrice: round100(recommendedPrice),
    stretchPrice: round100(stretchPrice),
    additionalRevisionRoundCost: round100(additionalRevisionRoundCost),
    extraRevisionCostTotal: round100(extraRevisionCostTotal),
    findersFeePercent,
    findersFeeAmount: round100(findersFeeAmount),
    netAfterFindersFee: round100(netAfterFindersFee),
  }
}

export function formatRs(n) {
  if (n == null || isNaN(n)) return 'Rs 0'
  return 'Rs ' + Math.round(n).toLocaleString('en-IN')
}
