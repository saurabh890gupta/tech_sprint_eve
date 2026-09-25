import { useMemo, useState } from 'react'
import type { MarginInputs, MarginResult } from './marginCalc'
import { runMarginCalc } from './marginCalc'
import './margin-agent.css'

type Mode = 'fob' | 'del'
type Address = { id: number; pincode: string; leadTime: number; pricePerPiece: number }
type Form = {
  product: string; baseMargin: number; fobPrice: number; quantity: number; country: number; countryIndex: number
  vendorGrade: number; customerGrade: number; customerAdv: number; customerCD: number
  vendorAdv: number; vendorCD: number; creditRate: number; prodLead: number; printing: number
}
type Quote = {
  name: string; savedAt: string; mode: Mode; delCurrency: string; product: string
  baseMargin: number | string; fobPrice: number | string; addresses: Address[]; quantity: number | string
  country: number; vendorGrade: number; customerGrade: number; customerAdv: number | string
  customerCD: number | string; vendorAdv: number | string; vendorCD: number | string
  creditRate: number | string; prodLead: number | string; printing: number
}

const STORAGE_KEY = 'pactap_quotes_v5'
const DEFAULT_FORM: Form = {
  product: 'Twisted Handle Paper Bags', baseMargin: 5, fobPrice: .085, quantity: 1000,
  country: 1, countryIndex: 0, vendorGrade: 1, customerGrade: .8, customerAdv: 30,
  customerCD: 30, vendorAdv: 30, vendorCD: 25, creditRate: 12, prodLead: 15, printing: 1,
}
const PRODUCTS = ['Twisted Handle Paper Bags','Single Wall Paper Cup','Flat Handle Paper Bag','J-Cut Paper Bag','Bagasse Clamshells','Bagasse Bowls','Bagasse Meal Tray','Paper Containers','Double Wall Paper Cup','Ripple Wall Paper Cups','Paper Dip Cups','Plastic Cups','Plastic Round Container','Paper Mailers','Padded Paper Mailers','Heavy Weight Plastic Containers','Rigid Boxes','Mono Cartons','LDPE Mailers','Plastic Meal Tray','Pillow Pouch']
const COUNTRIES = [['India',1],['United States',1],['United Arab Emirates',.7],['Canada',.6],['China',.7]] as const
const GRADES = [['A',.5],['B',.7],['C',.8],['D',1],['E',1.3]] as const
const SYMBOLS: Record<string,string> = { USD:'$', INR:'₹', EUR:'€', GBP:'£', AED:'AED ', CAD:'C$', CNY:'¥' }
const fmt = (n: number, digits: number) => Number.isFinite(n) ? n.toLocaleString('en-IN',{minimumFractionDigits:digits,maximumFractionDigits:digits}) : '0.00'
const signed = (n: number) => `${n >= 0 ? '+' : ''}${fmt(n,3)}`

function loadQuotes(): Record<string, Quote> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, Quote> } catch { return {} }
}

export default function MarginAgentModule() {
  const [mode, setMode] = useState<Mode>('fob')
  const [form, setForm] = useState<Form>(DEFAULT_FORM)
  const [currency, setCurrency] = useState('INR')
  const [addresses, setAddresses] = useState<Address[]>([{ id:1, pincode:'110001', leadTime:3, pricePerPiece:7.5 }])
  const [nextAddressId, setNextAddressId] = useState(2)
  const [quoteName, setQuoteName] = useState('')
  const [quotes, setQuotes] = useState<Record<string,Quote>>(loadQuotes)
  const inputs: MarginInputs = {
    productMargin:form.baseMargin, creditInterest:form.creditRate, productionLeadTime:form.prodLead,
    customerAdvance:form.customerAdv, customerCreditPeriod:form.customerCD, vendorAdvance:form.vendorAdv,
    vendorCreditPeriod:form.vendorCD, customerCountry:form.country, customerGrade:form.customerGrade,
    vendorGrade:form.vendorGrade, printing:form.printing,
  }
  const results = useMemo(() => mode === 'fob'
    ? [{ address:null, result:runMarginCalc(form.fobPrice,form.quantity,0,inputs) }]
    : addresses.map((address) => ({ address, result:runMarginCalc(Number(address.pricePerPiece),form.quantity,address.leadTime,inputs) })),
    [mode, form, addresses])
  const symbol = mode === 'fob' ? '$' : SYMBOLS[currency] || ''

  function update<K extends keyof Form>(key: K, value: Form[K]) { setForm((current) => ({ ...current, [key]:value })) }
  function persist(next: Record<string,Quote>) { localStorage.setItem(STORAGE_KEY,JSON.stringify(next)); setQuotes(next) }
  function reset() { setForm(DEFAULT_FORM); setCurrency('INR'); setAddresses([{id:1,pincode:'110001',leadTime:3,pricePerPiece:7.5}]); setNextAddressId(2) }
  function saveQuote() {
    const name = quoteName.trim()
    if (!name) { window.alert('Please enter a quote name'); return }
    const quote: Quote = { name,savedAt:new Date().toISOString(),mode,delCurrency:currency,product:form.product,baseMargin:form.baseMargin,fobPrice:form.fobPrice,addresses,quantity:form.quantity,country:form.countryIndex,vendorGrade:form.vendorGrade,customerGrade:form.customerGrade,customerAdv:form.customerAdv,customerCD:form.customerCD,vendorAdv:form.vendorAdv,vendorCD:form.vendorCD,creditRate:form.creditRate,prodLead:form.prodLead,printing:form.printing }
    persist({ ...quotes, [`q_${Date.now()}`]:quote }); setQuoteName('')
  }
  function loadQuote(quote: Quote) {
    const country = COUNTRIES[quote.country] ?? COUNTRIES[0]
    setForm({ product:quote.product,baseMargin:Number(quote.baseMargin),fobPrice:Number(quote.fobPrice),quantity:Number(quote.quantity),country:country[1],countryIndex:quote.country,vendorGrade:quote.vendorGrade,customerGrade:quote.customerGrade,customerAdv:Number(quote.customerAdv),customerCD:Number(quote.customerCD),vendorAdv:Number(quote.vendorAdv),vendorCD:Number(quote.vendorCD),creditRate:Number(quote.creditRate),prodLead:Number(quote.prodLead),printing:quote.printing })
    setCurrency(quote.delCurrency || 'INR'); setAddresses(quote.addresses || [{id:1,pincode:'110001',leadTime:3,pricePerPiece:7.5}]); setNextAddressId(Math.max(0,...(quote.addresses || []).map((a) => a.id))+1); setMode(quote.mode); window.scrollTo({top:0,behavior:'smooth'})
  }

  return <div className="margin-module"><div className="margin-container">
    <header className="margin-header"><div className="margin-logo"><span>P</span><div><h1>PACTAP <em>MARGIN AGENT</em></h1><p>Simplifying Packaging · Quote-to-Margin Automation</p></div></div><button className="primary" onClick={reset}>Reset</button></header>
    <div className="margin-modes"><button className={mode==='fob'?'active':''} onClick={() => setMode('fob')}>FOB (USD only)</button><button className={mode==='del'?'active':''} onClick={() => setMode('del')}>Delivered (Multi-currency)</button></div>

    <section className="margin-section"><h2>Common parameters</h2><div className="margin-form-grid">
      <MField label="Product"><select value={form.product} onChange={(e)=>update('product',e.target.value)}>{PRODUCTS.map((p)=><option key={p}>{p}</option>)}</select></MField>
      <NumberField label="Product Margin (%)" value={form.baseMargin} set={(v)=>update('baseMargin',v)} step=".1" />
      <NumberField label="Quantity" value={form.quantity} set={(v)=>update('quantity',v)} />
      <MField label="Country"><select value={form.countryIndex} onChange={(e)=>{const index=Number(e.target.value);setForm((f)=>({...f,countryIndex:index,country:COUNTRIES[index][1]}))}}>{COUNTRIES.map(([name,mult],i)=><option key={name} value={i}>{name} (×{mult})</option>)}</select></MField>
      <MField label="Vendor Grade"><Pills value={form.vendorGrade} set={(v)=>update('vendorGrade',v)} /></MField>
      <MField label="Customer Grade"><Pills value={form.customerGrade} set={(v)=>update('customerGrade',v)} /></MField>
      <NumberField label="Customer Advance (%)" value={form.customerAdv} set={(v)=>update('customerAdv',v)} />
      <NumberField label="Customer Credit (Days)" value={form.customerCD} set={(v)=>update('customerCD',v)} />
      <NumberField label="Vendor Advance (%)" value={form.vendorAdv} set={(v)=>update('vendorAdv',v)} />
      <NumberField label="Vendor Credit (Days)" value={form.vendorCD} set={(v)=>update('vendorCD',v)} />
      <NumberField label="Credit Interest (% p.a.)" value={form.creditRate} set={(v)=>update('creditRate',v)} step=".1" />
      <NumberField label="Production Lead Time (Days)" value={form.prodLead} set={(v)=>update('prodLead',v)} />
      <MField label="Printing Required"><div className="margin-pills"><button className={form.printing===1.2?'active':''} onClick={()=>update('printing',1.2)}>Yes (×1.2)</button><button className={form.printing===1?'active':''} onClick={()=>update('printing',1)}>No (×1.0)</button></div></MField>
    </div></section>

    {mode==='fob' ? <section className="margin-section"><div className="margin-title-row"><h2>FOB Pricing</h2><span className="margin-badge">🔒 Currency: USD (locked)</span></div><NumberField label="FOB Price per Piece ($)" value={form.fobPrice} set={(v)=>update('fobPrice',v)} step=".01" /></section>
    : <section className="margin-section"><div className="margin-title-row"><h2>Delivery Addresses</h2><div className="margin-inline"><select value={currency} onChange={(e)=>setCurrency(e.target.value)}>{Object.keys(SYMBOLS).filter((key)=>key!=='USD'||true).map((key)=><option key={key}>{key}</option>)}</select><button onClick={()=>{setAddresses((list)=>[...list,{id:nextAddressId,pincode:'',leadTime:3,pricePerPiece:7.5}]);setNextAddressId((id)=>id+1)}}>+ Add Address</button></div></div>{addresses.map((address)=><div className="margin-address" key={address.id}><MField label="Pincode / ZIP"><input value={address.pincode} onChange={(e)=>setAddresses((list)=>list.map((a)=>a.id===address.id?{...a,pincode:e.target.value}:a))}/></MField><NumberField label="Lead time (days)" value={address.leadTime} set={(v)=>setAddresses((list)=>list.map((a)=>a.id===address.id?{...a,leadTime:v}:a))}/><NumberField label={`Price/piece (${SYMBOLS[currency]})`} value={address.pricePerPiece} set={(v)=>setAddresses((list)=>list.map((a)=>a.id===address.id?{...a,pricePerPiece:v}:a))} step=".01"/>{addresses.length>1&&<button onClick={()=>setAddresses((list)=>list.filter((a)=>a.id!==address.id))}>Remove</button>}</div>)}</section>}

    {results.map(({address,result},index)=><ResultCard key={address?.id ?? 'fob'} result={result} symbol={symbol} label={mode==='fob'?'FOB Pricing · USD':`Delivery #${index+1} · ${address?.pincode||'No pincode'} · ${address?.leadTime} days · ${currency}`}/>)}
    {mode==='del'&&results.length>1&&<div className="margin-sum"><span>Sum across all addresses ({currency})</span><strong>{symbol}{fmt(results.reduce((sum,item)=>sum+item.result.grandTotalPrice,0),2)}</strong></div>}

    <section className="margin-section"><div className="margin-title-row"><h2>Saved Quotes</h2><div className="margin-inline"><input placeholder="Quote name (e.g. ABC Corp Jan)" value={quoteName} onChange={(e)=>setQuoteName(e.target.value)}/><button className="primary" onClick={saveQuote}>Save</button></div></div>
      {Object.entries(quotes).length===0?<p className="margin-empty">No saved quotes yet. Enter a name and click Save to remember a quote setup.</p>:Object.entries(quotes).sort((a,b)=>b[1].savedAt.localeCompare(a[1].savedAt)).map(([id,quote])=><div className="margin-saved" key={id}><div><strong>{quote.name} <span>{quote.mode==='fob'?'FOB · USD':`DEL · ${quote.delCurrency||'INR'}`}</span></strong><p>{quote.product} · {quote.quantity} pcs · saved {new Date(quote.savedAt).toLocaleString()}</p></div><div><button onClick={()=>loadQuote(quote)}>Load</button><button onClick={()=>{if(window.confirm('Delete this saved quote?')){const next={...quotes};delete next[id];persist(next)}}}>Delete</button></div></div>)}
    </section>
  </div></div>
}

function MField({label,children}:{label:string;children:React.ReactNode}){return <label className="margin-field"><span>{label}</span>{children}</label>}
function NumberField({label,value,set,step}:{label:string;value:number;set:(value:number)=>void;step?:string}){return <MField label={label}><input type="number" step={step} value={value} onChange={(e)=>set(Number(e.target.value))}/></MField>}
function Pills({value,set}:{value:number;set:(value:number)=>void}){return <div className="margin-pills">{GRADES.map(([label,mult])=><button key={label} className={value===mult?'active':''} onClick={()=>set(mult)}>{label}<small>×{mult}</small></button>)}</div>}
function ResultCard({result:r,symbol,label}:{result:MarginResult;symbol:string;label:string}) {
  const base=r.productMargin*r.customerRating*r.vendorRating*r.orderValueMultiplier*r.printValue
  return <article className="margin-result"><h3>{label}</h3><div className="margin-metrics"><Metric label="Total Margin %" value={`${fmt(r.totalMarginPercent,2)}%`}/><Metric label="Margin / Piece" value={`${symbol}${fmt(r.marginPerPiece,3)}`}/><Metric label="Final / Piece" value={`${symbol}${fmt(r.totalMarginPerPiece,3)}`}/><Metric label="Grand Total" value={`${symbol}${fmt(r.grandTotalPrice,2)}`}/></div><details><summary>▸ Show calculation breakdown</summary><div className="margin-trail"><Row label="Total price (qty × price/pc)" value={`${symbol}${fmt(r.totalPrice,2)}`}/><Row label="PO multiplier (slope formula)" value={fmt(r.orderValueMultiplier,4)}/><Row label="Product margin" value={`${fmt(r.productMargin,2)}%`}/><Row label="× Customer rating (Country × Grade)" value={fmt(r.customerRating,3)}/><Row label="× Vendor rating" value={fmt(r.vendorRating,2)}/><Row label="× Order value multiplier" value={fmt(r.orderValueMultiplier,4)}/><Row label="× Print value" value={fmt(r.printValue,2)}/><Row label="= Base subtotal" value={`${fmt(base,3)}%`} strong/><Row label="+ vStep5 (Vendor CI)" value={`${signed(r.vStep5)}%`}/><Row label="+ cStep5 (Customer CI)" value={`${signed(r.cStep5)}%`}/><Row label="= Total Margin %" value={`${fmt(r.totalMarginPercent,3)}%`} strong/><div className="margin-ci"><div><b>Vendor CI Steps</b><Row label="vStep1" value={fmt(r.vStep1,3)}/><Row label="vStep2" value={fmt(r.vStep2,3)}/><Row label="vStep3" value={fmt(r.vStep3,3)}/><Row label="vStep4" value={signed(r.vStep4)}/></div><div><b>Customer CI Steps</b><Row label="cStep1" value={fmt(r.cStep1,3)}/><Row label="cStep2" value={fmt(r.cStep2,3)}/><Row label="cStep3" value={fmt(r.cStep3,3)}/><Row label="cStep4" value={signed(r.cStep4)}/></div></div></div></details></article>
}
function Metric({label,value}:{label:string;value:string}){return <div className="margin-metric"><span>{label}</span><strong>{value}</strong></div>}
function Row({label,value,strong=false}:{label:string;value:string;strong?:boolean}){return <div className={strong?'margin-row strong':'margin-row'}><span>{label}</span><span>{value}</span></div>}
