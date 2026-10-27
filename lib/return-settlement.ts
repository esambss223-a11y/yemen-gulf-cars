interface ReturnSettlement {
  deposit: number;
  dailyRate: number;
  hasDelay: boolean;
  lateNoticeGiven: boolean;
  lateHours: number;
  cleanlinessFee: number;
  hasDamages: boolean;
  damageFee: number;
}

// Existing return rules, shared with the presentation tests.
export function calculateReturnSettlement(input: ReturnSettlement) {
  const penaltyFee = !input.hasDelay ? 0 : input.lateNoticeGiven ? input.lateHours * 200 : input.dailyRate;
  const actualDamageFee = input.hasDamages ? Math.max(0, input.damageFee) : 0;
  const totalDeductions = penaltyFee + input.cleanlinessFee + actualDamageFee;
  return {
    penaltyFee, actualDamageFee, totalDeductions,
    netRefundableDeposit: Math.max(0, input.deposit - totalDeductions),
    clientOwesExtra: Math.max(0, totalDeductions - input.deposit),
  };
}
