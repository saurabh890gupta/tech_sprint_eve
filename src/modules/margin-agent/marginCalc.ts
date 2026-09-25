export interface MarginInputs {
  productMargin: number
  creditInterest: number
  productionLeadTime: number
  customerAdvance: number
  customerCreditPeriod: number
  vendorAdvance: number
  vendorCreditPeriod: number
  customerCountry: number
  customerGrade: number
  vendorGrade: number
  printing: number
}

export interface MarginResult {
  pricePerPiece: number
  quantity: number
  totalPrice: number
  leadTime: number
  orderValueMultiplier: number
  vStep1: number
  vStep2: number
  vStep3: number
  vStep4: number
  vStep5: number
  cStep1: number
  cStep2: number
  cStep3: number
  cStep4: number
  cStep5: number
  customerRating: number
  vendorRating: number
  printValue: number
  productMargin: number
  totalMarginPercent: number
  marginPerPiece: number
  totalMarginPerPiece: number
  grandTotalPrice: number
}

const ORDER_VALUE = [
  { key: 0, value: 1.3 },
  { key: 50000, value: 2.5 },
  { key: 300000, value: 1.3 },
  { key: 1000000, value: 1 },
  { key: 2000000, value: .8 },
  { key: 2000001, value: .5 },
]

const round3 = (n: number) => Number(Number(n).toFixed(3))

export function calcOrderValueMultiplier(totalPrice: number) {
  const first = ORDER_VALUE[0]
  const last = ORDER_VALUE[ORDER_VALUE.length - 1]
  if (totalPrice <= first.key) return first.value
  if (totalPrice >= last.key) return last.value
  let lower = first
  let upper = ORDER_VALUE[1]
  for (let index = 0; index < ORDER_VALUE.length - 1; index += 1) {
    if (totalPrice >= ORDER_VALUE[index].key && totalPrice < ORDER_VALUE[index + 1].key) {
      lower = ORDER_VALUE[index]
      upper = ORDER_VALUE[index + 1]
    }
  }
  const slope = (upper.value - lower.value) / (upper.key - lower.key)
  return totalPrice * slope + (lower.value - slope * lower.key)
}

export function runMarginCalc(pricePerPiece: number, quantity: number, leadTime: number, input: MarginInputs): MarginResult {
  const customerRating = input.customerCountry * input.customerGrade
  const totalPrice = pricePerPiece * quantity
  const orderValueMultiplier = calcOrderValueMultiplier(totalPrice)
  const vStep1 = round3((input.creditInterest / 100) * quantity * pricePerPiece)
  const vStep2 = round3(vStep1 * (input.vendorAdvance / 100) * (input.productionLeadTime / 365))
  const vStep3 = round3(vStep1 * (1 - input.vendorAdvance / 100) * (input.vendorCreditPeriod / 365))
  const vStep4 = round3(vStep2 - vStep3)
  const vStep5 = round3(totalPrice > 0 ? vStep4 / totalPrice * 100 : 0)
  const cStep1 = round3((input.creditInterest / 100) * quantity * pricePerPiece)
  const cStep2 = round3(cStep1 * (input.customerAdvance / 100) * (input.productionLeadTime / 365))
  const cStep3 = round3(cStep1 * (1 - input.customerAdvance / 100) * (input.customerCreditPeriod / 365))
  const cStep4 = round3(cStep3 - cStep2)
  const cStep5 = round3(totalPrice > 0 ? cStep4 / totalPrice * 100 : 0)
  const totalMarginPercent = round3(input.productMargin * customerRating * input.vendorGrade * orderValueMultiplier * input.printing + vStep5 + cStep5)
  const marginPerPiece = round3(totalMarginPercent / 100 * pricePerPiece)
  const totalMarginPerPiece = round3(marginPerPiece + pricePerPiece)
  const grandTotalPrice = round3(totalMarginPerPiece * quantity)
  return {
    pricePerPiece, quantity, totalPrice, leadTime, orderValueMultiplier,
    vStep1, vStep2, vStep3, vStep4, vStep5,
    cStep1, cStep2, cStep3, cStep4, cStep5,
    customerRating, vendorRating: input.vendorGrade, printValue: input.printing,
    productMargin: input.productMargin, totalMarginPercent, marginPerPiece,
    totalMarginPerPiece, grandTotalPrice,
  }
}
