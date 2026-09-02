(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const l of s)if(l.type==="childList")for(const p of l.addedNodes)p.tagName==="LINK"&&p.rel==="modulepreload"&&n(p)}).observe(document,{childList:!0,subtree:!0});function a(s){const l={};return s.integrity&&(l.integrity=s.integrity),s.referrerPolicy&&(l.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?l.credentials="include":s.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function n(s){if(s.ep)return;s.ep=!0;const l=a(s);fetch(s.href,l)}})();const i={webMcpStatus:{supported:null,toolCount:0,message:"Checking this browser for WebMCP…"},live:{connected:!1,loading:!1,company:null,user:null,model:null,openaiConfigured:!1,openaiProvider:null,capabilities:{},error:null}},q={role:"agent",html:`
    <p><strong>I’m ready to close the reconciliation loop safely.</strong></p>
    <p>I can inspect transactions, explain invoice matches, surface uncertainty and prepare actions for your approval.</p>
    <div class="message-callout"><span>Safety contract</span> I can prepare. You approve. No payment execution tool exists.</div>
  `,tools:[]},r={activeSection:"overview",filter:"all",search:"",invoiceFilter:"all",invoiceSearch:"",selectedTransactionId:null,selectedInvoiceId:null,showToolRegistry:!1,showLiveLogin:!1,mobileNavOpen:!1,agentBusy:!1,bankSyncAt:new Date().toISOString(),messages:[q]},j="cherry-webmcp-sandbox-v3",K=3,Q=e=>JSON.parse(JSON.stringify(e)),$=(e=0)=>{const t=new Date;return t.setHours(12,0,0,0),t.setDate(t.getDate()+e),t.toISOString().slice(0,10)};function le(){return{schemaVersion:K,source:"representative-sandbox",accounts:[{id:"acc_business",name:"Cherry Business Current",sortCodeMasked:"04-••-18",currency:"GBP",balance:12480.42,available:12190.42,provider:"Open Banking sandbox"},{id:"acc_reserve",name:"Cherry Tax Reserve",sortCodeMasked:"04-••-18",currency:"GBP",balance:4180,available:4180,provider:"Open Banking sandbox"}],invoices:[{id:"inv_1048",number:"INV-1048",customer:"Northstar Studio Ltd",total:680,outstanding:680,dueDate:$(-1),status:"unpaid"},{id:"inv_1049",number:"INV-1049",customer:"Acorn Consulting",total:1250,outstanding:1250,dueDate:$(2),status:"unpaid"},{id:"inv_1050",number:"INV-1050",customer:"Green & Co",total:245.5,outstanding:245.5,dueDate:$(-3),status:"unpaid"},{id:"inv_1051",number:"INV-1051",customer:"Bluefield Design",total:680,outstanding:680,dueDate:$(5),status:"unpaid"},{id:"inv_1044",number:"INV-1044",customer:"River Lane CIC",total:910,outstanding:0,dueDate:$(-8),status:"paid"}],transactions:[{id:"txn_001",accountId:"acc_business",bookingDate:$(-1),description:"NORTHSTAR STUDIO INV-1048",merchant:"Northstar Studio Ltd",direction:"credit",amount:680,status:"needs_review"},{id:"txn_002",accountId:"acc_business",bookingDate:$(-1),description:"ACORN CONSULTING INV1049",merchant:"Acorn Consulting",direction:"credit",amount:1250,status:"needs_review"},{id:"txn_003",accountId:"acc_business",bookingDate:$(-1),description:"AWS EMEA",merchant:"Amazon Web Services",direction:"debit",amount:87.42,status:"needs_review"},{id:"txn_004",accountId:"acc_business",bookingDate:$(-2),description:"GREEN AND CO PAYMENT",merchant:"Green & Co",direction:"credit",amount:245.5,status:"needs_review"},{id:"txn_005",accountId:"acc_business",bookingDate:$(-2),description:"TFL TRAVEL",merchant:"Transport for London",direction:"debit",amount:18.7,status:"matched"},{id:"txn_006",accountId:"acc_business",bookingDate:$(-3),description:"CLIENT PAYMENT",merchant:"Unknown sender",direction:"credit",amount:680,status:"needs_review"}],approvals:[],paymentDrafts:[],toolActivity:[],activity:[{id:"event_seed",at:new Date().toISOString(),actor:"Cherry",kind:"system",message:"Secure finance sandbox loaded. No production data or credentials are used."}]}}function xe(){if(typeof localStorage>"u")return null;try{const e=JSON.parse(localStorage.getItem(j)||"null");return e?.source==="cherry-money-production"||e?.transactions?.some(a=>a?.source==="cherry-money-production")?(localStorage.removeItem(j),null):e?.schemaVersion===K?e:null}catch{return null}}const d=xe()||le(),Y=new Set;let F=!0;function ke(){if(!(!F||d.source==="cherry-money-production"||typeof localStorage>"u"))try{localStorage.setItem(j,JSON.stringify(d))}catch{}}function T(){ke();for(const e of Y)e(d)}function R(e){if(F=!!e,!F&&typeof localStorage<"u")try{localStorage.removeItem(j)}catch{}}function Me(e){return Y.add(e),()=>Y.delete(e)}function U({record:e=!0}={}){F=!0;const t=le();for(const a of Object.keys(d))delete d[a];return Object.assign(d,t),e&&E("Human","Reset the sandbox to its original demonstration state.","reset",!1),T(),d}const D=e=>Number(Number(e).toFixed(2)),C=e=>String(e??"").toLowerCase().replace(/[^a-z0-9]/g,"");function k(e){return d.transactions.find(t=>t.id===e)}function O(e){return d.invoices.find(t=>t.id===e)}function x(e){const t=k(e);if(!t)throw new Error("Bank transaction not found.");if(t.backendSuggestion)return Q(t.backendSuggestion);if(t.direction!=="credit"){const u=/aws|google|microsoft|software|hosting/i.test(`${t.description} ${t.merchant}`)?"Software and subscriptions":/tfl|train|uber|travel|bus/i.test(`${t.description} ${t.merchant}`)?"Travel":"General expense";return{transactionId:e,match:null,candidates:[],confidence:u==="General expense"?52:58,ready:!1,ambiguous:!1,reason:"This is a debit and should be reviewed against an expense or supplier bill rather than a sales invoice.",suggestedCategory:u,recommendedAction:"Review expense category",signals:["Debit direction",`Suggested category: ${u}`]}}const a=d.invoices.filter(u=>u.status==="unpaid"&&D(u.outstanding)===D(t.amount)).map(u=>{const m=C(`${t.description} ${t.merchant}`),y=!!(C(u.number)&&m.includes(C(u.number))||C(u.customer)&&m.includes(C(u.customer))),g=y?94:82;return{invoiceId:u.id,invoiceNumber:u.number,customer:u.customer,amount:u.outstanding,dueDate:u.dueDate,confidence:g,referenceHit:y}}).sort((u,m)=>m.confidence-u.confidence);if(!a.length)return{transactionId:e,match:null,candidates:[],confidence:45,ready:!1,ambiguous:!1,reason:"No unpaid invoice has the same outstanding amount.",recommendedAction:"Search or create a manual match",signals:["No exact amount match"]};const n=a[0],s=a.filter(u=>u.confidence===n.confidence),l=s.length>1&&!n.referenceHit,p=l?68:n.confidence;return{transactionId:e,match:{invoiceId:n.invoiceId,invoiceNumber:n.invoiceNumber,customer:n.customer,amount:n.amount},candidates:a,confidence:p,ready:p>=80&&!l,ambiguous:l,reason:n.referenceHit?"Amount and bank reference point to the same unpaid invoice.":l?"The amount matches more than one unpaid invoice, so human review is required.":"The amount uniquely matches an unpaid invoice.",recommendedAction:l?"Ask the human to choose the correct invoice":"Stage for human approval",signals:n.referenceHit?["Exact amount","Invoice reference or customer match"]:l?["Exact amount",`${s.length} equally plausible invoices`]:["Exact amount","Unique unpaid invoice"]}}function N(){const e=d.transactions.filter(t=>t.status==="needs_review").map(t=>({transaction:t,suggestion:x(t.id)}));return{confident:e.filter(({suggestion:t})=>t.ready),exceptions:e.filter(({suggestion:t})=>!t.ready),pendingApprovals:d.approvals.filter(t=>t.status==="pending")}}function V(e,t){const a=k(e),n=O(t);if(!a)throw new Error("Bank transaction not found.");if(!n)throw new Error("Invoice not found.");if(a.status==="matched")throw new Error("Transaction is already reconciled.");if(a.direction!=="credit")throw new Error("Sales invoice reconciliation can only be staged for a credit transaction.");if(n.status!=="unpaid")throw new Error("The selected invoice is no longer unpaid.");if(D(a.amount)!==D(n.outstanding))throw new Error("Transaction and invoice outstanding amounts do not match.");const s=d.approvals.find(p=>p.transactionId===e&&p.status==="pending");if(s)return s;const l={id:`approval_${Date.now()}`,type:"reconciliation",transactionId:e,invoiceId:t,amount:a.amount,status:"pending",createdAt:new Date().toISOString(),preparedBy:"WebMCP agent"};return d.approvals.unshift(l),a.status="pending_approval",E("Agent",`Staged ${a.id} → ${n.number}. Human approval is required.`,"approval",!1),T(),l}function Ae(e){const t=d.approvals.find(s=>s.id===e);if(!t||t.status!=="pending")throw new Error("Pending approval not found.");const a=k(t.transactionId),n=O(t.invoiceId);if(!a||!n)throw new Error("The staged reconciliation is no longer valid.");return t.status="approved",t.approvedAt=new Date().toISOString(),a.status="matched",n.status="paid",n.outstanding=0,E("Human",`Approved ${a.id} → ${n.number}. The reconciliation is now complete.`,"approved",!1),T(),t}function de({payee:e,amount:t,reference:a="",purpose:n=""}){const s=D(t);if(!String(e||"").trim()||s<=0)throw new Error("A payee and positive amount are required.");const l=d.paymentDrafts.find(u=>u.status==="draft_only"&&C(u.payee)===C(e)&&D(u.amount)===s&&C(u.reference)===C(a));if(l)return l;const p={id:`payment_${Date.now()}`,payee:String(e).trim(),amount:s,reference:String(a||"").trim(),purpose:String(n||"").trim(),status:"draft_only",createdAt:new Date().toISOString(),moneyMoved:!1};return d.paymentDrafts.unshift(p),E("Agent",`Prepared a payment draft for ${p.payee} (£${p.amount.toFixed(2)}). No money moved.`,"payment",!1),T(),p}function w(e,t,a,n="success"){d.toolActivity.unshift({id:`tool_${Date.now()}_${Math.random().toString(16).slice(2)}`,at:new Date().toISOString(),toolName:e,input:Q(t||{}),summary:a,status:n}),d.toolActivity=d.toolActivity.slice(0,20),T()}function E(e,t,a="info",n=!0){d.activity.unshift({id:`event_${Date.now()}_${Math.random().toString(16).slice(2)}`,at:new Date().toISOString(),actor:e,kind:a,message:t}),d.activity=d.activity.slice(0,30),n&&T()}function X(){const e=N();return{totalBalance:d.accounts.reduce((t,a)=>t+Number(a.balance),0),availableBalance:d.accounts.reduce((t,a)=>t+Number(a.available),0),reviewCount:d.transactions.filter(t=>t.status==="needs_review").length,matchedCount:d.transactions.filter(t=>t.status==="matched").length,pendingCount:d.approvals.filter(t=>t.status==="pending").length,confidentCount:e.confident.length,exceptionCount:e.exceptions.length}}function pe(e){if(!e||e.source!=="cherry-money-production")throw new Error("Cherry Money returned an invalid live workspace payload.");return R(!1),d.schemaVersion=K,d.source="cherry-money-production",d.accounts=Array.isArray(e.accounts)?e.accounts.map(t=>({id:String(t.id),name:String(t.name||"Connected bank account"),sortCodeMasked:t.sortCodeMasked||"Production connection",currency:t.currency||e.company?.currency||"GBP",balance:t.balance==null?0:Number(t.balance),available:t.available==null?t.balance==null?0:Number(t.balance):Number(t.available),balanceUnavailable:t.balance==null,provider:t.provider||"Cherry Money production",status:t.status||"connected",lastSyncedAt:t.lastSyncedAt||null})):[],d.invoices=Array.isArray(e.invoices)?e.invoices.map(t=>({id:String(t.id),number:String(t.number||t.id),customer:String(t.customer||"Customer"),total:Number(t.total||0),outstanding:Number(t.outstanding||0),dueDate:t.dueDate||"",status:t.status==="paid"?"paid":"unpaid",viewUrl:t.viewUrl||""})):[],d.transactions=Array.isArray(e.transactions)?e.transactions.map(t=>({id:String(t.id),accountId:String(t.accountId||""),bookingDate:t.bookingDate||"",description:String(t.description||""),merchant:String(t.merchant||t.description||"Bank transaction"),direction:t.direction==="debit"?"debit":"credit",amount:Number(t.amount||0),currency:t.currency||e.company?.currency||"GBP",status:t.status||"needs_review",backendSuggestion:t.suggestion||null,source:"cherry-money-production"})):[],d.approvals=Array.isArray(e.approvals)?e.approvals:[],d.paymentDrafts=Array.isArray(e.paymentDrafts)?e.paymentDrafts:[],d.toolActivity=[],d.activity=[{id:`event_live_${Date.now()}`,at:new Date().toISOString(),actor:"Cherry",kind:"system",message:`Authenticated production workspace loaded for ${e.company?.name||"Cherry Money"}.`}],T(),d}function Ie(){return Q({exportedAt:new Date().toISOString(),environment:d.source==="cherry-money-production"?"authenticated Cherry Money production":"representative sandbox",approvals:d.approvals,paymentDrafts:d.paymentDrafts,toolActivity:d.toolActivity,activity:d.activity})}const _e="https://cherrymoney.co.uk/api",Z="cherry-webmcp-live-token",ee="cherry-webmcp-live-profile",Pe="google-auth",ue="google-error",Te=new Set(["https://cherrymoney.co.uk","https://www.cherrymoney.co.uk","http://localhost:8000"]);function Le(e){const t=new URL(String(e).replace(/\/$/,""));if(!Te.has(t.origin))throw new Error("The configured Cherry Money API origin is not approved.");return`${t.origin}${t.pathname.replace(/\/$/,"")}`}const te=Le(_e),Re=new URL(te).origin;function ne(){try{return sessionStorage.getItem(Z)||""}catch{return""}}function De(){try{return JSON.parse(sessionStorage.getItem(ee)||"null")}catch{return null}}function Oe(){return!!ne()}function M(){try{sessionStorage.removeItem(Z),sessionStorage.removeItem(ee)}catch{}}function ve(e){if(!e?.token)throw new Error(e?.error||"Cherry Money did not return an authenticated session token.");try{sessionStorage.setItem(Z,e.token),sessionStorage.setItem(ee,JSON.stringify(e.user||null))}catch{throw M(),new Error("This browser does not allow tab-scoped session storage, so a secure live session cannot be retained.")}return e}async function A(e,t={}){const a=ne(),n=new Headers(t.headers||{});n.set("Accept","application/json"),t.body!==void 0&&n.set("Content-Type","application/json"),a&&n.set("Authorization",`Bearer ${a}`);const s=await fetch(`${te}${e}`,{...t,credentials:"omit",cache:"no-store",referrerPolicy:"strict-origin-when-cross-origin",headers:n,body:t.body===void 0?void 0:JSON.stringify(t.body)});let l=null;try{l=await s.json()}catch{l=null}if(s.status===401&&(M(),window.dispatchEvent(new CustomEvent("cherry-live-session-expired"))),!s.ok){const p=l?.errors?Object.values(l.errors).flat().join(" "):"",u=l?.message||l?.reply||p||`Cherry Money returned HTTP ${s.status}.`,m=new Error(u);throw m.status=s.status,m.payload=l,m}return l}async function Ne(e,t){const a=await A("/login",{method:"POST",body:{email:e,password:t}});return ve(a)}function Ee(){const e=new URL("/webmcp/google/redirect",Re);return e.searchParams.set("return_origin",window.location.origin),e.toString()}async function Be(e){const t=await A("/webmcp/google/exchange",{method:"POST",body:{code:e}});return ve(t)}function qe(){return typeof window>"u"||!window.location.hash?"":new URLSearchParams(window.location.hash.slice(1)).get(ue)||""}function ie(e){window.history.replaceState(null,"",`${window.location.pathname}${window.location.search}#${e}`),window.location.reload()}async function He(){if(typeof window>"u"||!window.location.hash)return;const t=new URLSearchParams(window.location.hash.slice(1)).get(Pe);if(t){window.history.replaceState(null,"",`${window.location.pathname}${window.location.search}`);try{await Be(t),ie("tools")}catch(a){M(),ie(`${ue}=${encodeURIComponent(a.message)}`)}}}typeof window<"u"&&queueMicrotask(()=>{He().catch(()=>{M()})});async function Ge(){try{ne()&&await A("/logout",{method:"GET"})}finally{M()}}const me=(e=50)=>A(`/webmcp/bootstrap?limit=${encodeURIComponent(e)}`);function je(e,t=[]){return A("/webmcp/ask",{method:"POST",body:{message:e,history:t}})}function he(e){return A("/webmcp/reconciliation/suggest",{method:"POST",body:{transaction_id:e}})}function ae(e,t){return A("/webmcp/reconciliation/stage",{method:"POST",body:{transaction_id:e,invoice_id:t}})}function Fe(e){return A(`/webmcp/reconciliation/${encodeURIComponent(e)}/approve`,{method:"POST",headers:{"X-Cherry-Human-Approval":"confirmed"},body:{confirmation:!0}})}function ge(e){return A("/webmcp/payment-drafts",{method:"POST",body:e})}const Ve=[{name:"cherry_get_accounts",title:"Get Cherry bank accounts",mode:"Read only",risk:"low",description:"Read the bank accounts currently visible in the Cherry Money workspace. Never initiates money movement."},{name:"cherry_get_transactions",title:"Get bank transactions",mode:"Read only",risk:"low",description:"Retrieve bank transactions and filter them by reconciliation state for analysis."},{name:"cherry_search_invoices",title:"Search Cherry invoices",mode:"Read only",risk:"low",description:"Search invoices by customer, invoice number, outstanding amount or payment status."},{name:"cherry_suggest_reconciliation",title:"Suggest reconciliation",mode:"Advisory",risk:"low",description:"Explain the best transaction-to-invoice match, including confidence, signals and ambiguity."},{name:"cherry_stage_reconciliation",title:"Stage reconciliation",mode:"Approval required",risk:"guarded",description:"Prepare a reconciliation in the visible approval queue. A human must complete the decision."},{name:"cherry_get_exceptions",title:"Get exceptions",mode:"Read only",risk:"low",description:"Return ambiguous, low-confidence and approval-pending items that need human attention."},{name:"cherry_create_payment_draft",title:"Create payment draft",mode:"Draft only",risk:"guarded",description:"Prepare a payment draft for review. It cannot send, authorise or execute a payment."}];function _(e,t="Cherry Money tool completed."){return{content:[{type:"text",text:`${t}
${JSON.stringify(e,null,2)}`}]}}const I=()=>i.live.connected;async function L(){const e=await me();return pe(e),i.live.company=e.company||i.live.company,i.live.user=e.user||i.live.user,i.live.model=e.openai?.model||i.live.model,i.live.openaiConfigured=!!e.openai?.configured,i.live.capabilities=e.capabilities||i.live.capabilities||{},e}function Ue(e,t=25){const a=Number(e);return Number.isFinite(a)?Math.max(1,Math.min(50,Math.trunc(a))):t}function P(e,t,a,n="success"){w(e,t,a,n)}function We({onChange:e=()=>{}}={}){return[{name:"cherry_get_accounts",title:"Get Cherry bank accounts",description:"Use this read-only tool to inspect the bank accounts visible in the current Cherry Money workspace. It never initiates or prepares money movement.",annotations:{readOnlyHint:!0},inputSchema:{type:"object",properties:{},additionalProperties:!1},execute:async(t={})=>{I()&&await L();const a=d.accounts.map(({id:n,name:s,sortCodeMasked:l,currency:p,balance:u,available:m,provider:y,status:g,lastSyncedAt:Se})=>({id:n,name:s,sortCodeMasked:l,currency:p,balance:u,available:m,provider:y,status:g,lastSyncedAt:Se}));return P("cherry_get_accounts",t,`Returned ${a.length} bank accounts.`),_(a,`Returned ${a.length} bank accounts visible in Cherry Money.`)}},{name:"cherry_get_transactions",title:"Get bank transactions",description:"Use this read-only tool to inspect bank transactions for reconciliation. Set status to review when the user asks what still needs attention. This tool never changes a transaction.",annotations:{readOnlyHint:!0},inputSchema:{type:"object",properties:{status:{type:"string",enum:["all","review","matched","pending_approval"],description:"Filter by reconciliation state. Use review for unresolved transactions."},limit:{type:"integer",minimum:1,maximum:50,description:"Maximum number of transactions to return."}},additionalProperties:!1},execute:async({status:t="all",limit:a=25}={})=>{I()&&await L();let n=[...d.transactions];t==="review"?n=n.filter(l=>["needs_review","pending_approval"].includes(l.status)):t!=="all"&&(n=n.filter(l=>l.status===t));const s=n.slice(0,Ue(a));return P("cherry_get_transactions",{status:t,limit:a},`Returned ${s.length} transactions.`),_(s,`Returned ${s.length} Cherry bank transaction(s).`)}},{name:"cherry_search_invoices",title:"Search Cherry invoices",description:"Use this read-only tool to find invoices by invoice number, customer, outstanding amount or payment status. It does not change invoice state.",annotations:{readOnlyHint:!0},inputSchema:{type:"object",properties:{query:{type:"string",maxLength:120,description:"Optional customer name or invoice number."},amount:{type:"number",minimum:0,maximum:1e7,description:"Optional outstanding amount in GBP."},status:{type:"string",enum:["all","unpaid","paid"],description:"Invoice payment status."}},additionalProperties:!1},execute:async({query:t="",amount:a,status:n="all"}={})=>{I()&&await L();const s=String(t).trim().toLowerCase(),l=d.invoices.filter(p=>{const u=!s||`${p.number} ${p.customer}`.toLowerCase().includes(s),m=a===void 0||Math.abs(Number(p.outstanding)-Number(a))<.005,y=n==="all"||p.status===n;return u&&m&&y});return P("cherry_search_invoices",{query:t,amount:a,status:n},`Found ${l.length} invoices.`),_(l,`Found ${l.length} matching invoice(s).`)}},{name:"cherry_suggest_reconciliation",title:"Suggest reconciliation",description:"Use this advisory tool to analyse one bank transaction and explain the best invoice match, confidence, signals and ambiguity. It makes no financial change.",annotations:{readOnlyHint:!0},inputSchema:{type:"object",properties:{transaction_id:{type:"string",maxLength:191,description:"Cherry transaction ID, for example txn_001."}},required:["transaction_id"],additionalProperties:!1},execute:async({transaction_id:t})=>{const a=I()?(await he(t)).suggestion:x(t);return P("cherry_suggest_reconciliation",{transaction_id:t},`${a.confidence}% confidence; ready=${a.ready}.`),_(a,a.ready?`A high-confidence reconciliation suggestion is available (${a.confidence}%).`:`This transaction requires human review (${a.confidence}% confidence).`)}},{name:"cherry_stage_reconciliation",title:"Stage reconciliation for approval",description:"Use this guarded tool only after identifying the intended transaction and invoice. It prepares a pending reconciliation in the Cherry UI but does not approve or complete it. Tell the user that explicit human approval is still required.",annotations:{readOnlyHint:!1},inputSchema:{type:"object",properties:{transaction_id:{type:"string",maxLength:191,description:"Bank transaction ID to stage."},invoice_id:{type:"string",maxLength:191,description:"Invoice ID to stage as the proposed match."}},required:["transaction_id","invoice_id"],additionalProperties:!1},execute:async({transaction_id:t,invoice_id:a})=>{let n;if(I())n=(await ae(t,a)).approval,await L();else{if(!k(t))throw new Error("Bank transaction not found.");n=V(t,a)}return P("cherry_stage_reconciliation",{transaction_id:t,invoice_id:a},"Reconciliation staged; human approval required."),e(),_({approval:n,transactionStatus:k(t)?.status||"pending_approval",requiresHumanApproval:!0,reconciliationCompleted:!1,nextStep:"Ask the user to review the visible approval queue and press Approve reconciliation themselves."},"Reconciliation staged. It has not been approved or completed.")}},{name:"cherry_get_exceptions",title:"Get reconciliation exceptions",description:"Use this read-only tool when the user asks what needs attention. It returns ambiguous or low-confidence transactions plus staged actions awaiting explicit human approval.",annotations:{readOnlyHint:!0},inputSchema:{type:"object",properties:{},additionalProperties:!1},execute:async(t={})=>{I()&&await L();const a=N(),n={exceptions:a.exceptions,pendingApprovals:a.pendingApprovals};return P("cherry_get_exceptions",t,`${n.exceptions.length} exceptions; ${n.pendingApprovals.length} pending approvals.`),_(n,`${n.exceptions.length} exception(s) and ${n.pendingApprovals.length} pending approval(s) require attention.`)}},{name:"cherry_create_payment_draft",title:"Create payment draft",description:"Use this guarded tool to prepare a payment draft for visible human review. It never sends, executes or authorises a payment, and no payment-execution tool is exposed by this application.",annotations:{readOnlyHint:!1},inputSchema:{type:"object",properties:{payee:{type:"string",minLength:1,maxLength:120,description:"Payee display name."},amount:{type:"number",exclusiveMinimum:0,maximum:1e7,description:"Payment amount in GBP."},reference:{type:"string",maxLength:35,description:"Payment reference."},purpose:{type:"string",maxLength:240,description:"Reason for the payment."}},required:["payee","amount"],additionalProperties:!1},execute:async t=>{const a=I()?(await ge(t)).draft:de(t);return I()&&await L(),P("cherry_create_payment_draft",t,"Payment draft created; no money moved."),e(),_({draft:a,moneyMoved:!1,paymentExecuted:!1,requiresHumanApproval:!0,safetyBoundary:"No WebMCP payment execution or authorisation tool exists in this application."},"Payment draft created. No money moved.")}}]}async function Je({onChange:e=()=>{}}={}){const t=document.modelContext??navigator.modelContext;if(!t||typeof t.registerTool!="function")return{supported:!1,toolCount:0,toolNames:[],message:"WebMCP is not exposed by this browser. Use the guided demo or open this page in ChatGPT’s browser / Chrome 149+ with WebMCP enabled."};const a=new AbortController,n=We({onChange:e});for(const s of n)await t.registerTool(s,{signal:a.signal});return window.__cherryWebMcpController=a,{supported:!0,toolCount:n.length,toolNames:n.map(s=>s.name),controller:a,message:`${n.length} WebMCP tools are live and discoverable.`}}const re={home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9 21v-7h6v7"/>',transactions:'<path d="M4 7h16M4 12h16M4 17h10"/><path d="m17 15 3 3-3 3"/>',invoice:'<path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',reconcile:'<path d="M20 7h-6V1"/><path d="M20 7a9 9 0 1 0 1 8"/><path d="m4 17 4-4 3 3"/>',card:'<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>',link:'<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/>',chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/>',agent:'<rect x="4" y="7" width="16" height="13" rx="4"/><path d="M12 3v4M8 12h.01M16 12h.01M8 16h8"/>',rules:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="11" cy="18" r="2"/>',audit:'<path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.2.36.31.76.31 1.17V10h.1v4h-.1c0 .41-.11.81-.31 1z"/>',sparkles:'<path d="m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2zM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8zM19 14l.7 1.8 1.8.7-1.8.7L19 19l-.7-1.8-1.8-.7 1.8-.7z"/>',shield:'<path d="M12 2 20 5v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',bank:'<path d="m3 10 9-6 9 6"/><path d="M5 10h14M6 10v8M10 10v8M14 10v8M18 10v8M4 20h16"/>',check:'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',alert:'<path d="M12 3 2.5 20h19z"/><path d="M12 9v4M12 17h.01"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',arrow:'<path d="M5 12h14M14 7l5 5-5 5"/>',external:'<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6H5V6h6"/>',reset:'<path d="M20 6v5h-5"/><path d="M19 11a8 8 0 1 0 1 5"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',close:'<path d="m5 5 14 14M19 5 5 19"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',download:'<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',chevron:'<path d="m8 10 4 4 4-4"/>',dot:'<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>'};function o(e,t=18,a=""){return`<svg class="icon ${a}" width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${re[e]||re.dot}</svg>`}const h=e=>new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(Number(e)),H=(e,t={day:"numeric",month:"short"})=>new Intl.DateTimeFormat("en-GB",t).format(new Date(`${e}T12:00:00`)),W=e=>new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit"}).format(new Date(e)),c=e=>String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");function ye(e){return{needs_review:"Needs review",pending_approval:"Pending approval",matched:"Matched",ignored:"Ignored"}[e]||e}function f(e,t="success"){const a=document.querySelector("#toast-region");if(!a)return;const n=document.createElement("div");n.className=`toast ${t}`,n.innerHTML=`${o(t==="error"?"alert":"check",17)}<span>${c(e)}</span>`,a.append(n),requestAnimationFrame(()=>n.classList.add("show")),setTimeout(()=>{n.classList.remove("show"),setTimeout(()=>n.remove(),220)},3600)}function J(){return`
    <span class="cherry-logo" aria-hidden="true">
      <svg viewBox="0 0 52 52" role="img">
        <path d="M27 19c2-7 6-11 14-12" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M25 19c-1-7-4-11-10-14" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M36 8c4-1 8 0 10 3-4 2-8 2-11 0" fill="currentColor" opacity=".78"/>
        <circle cx="19" cy="31" r="10" fill="currentColor" opacity=".95"/>
        <circle cx="35" cy="32" r="9" fill="currentColor" opacity=".72"/>
      </svg>
    </span>`}function ze(){const e=[["overview","home","Overview"],["transactions","transactions","Transactions"],["approvals","reconcile","Approval queue"],["tools","agent","WebMCP tools"],["audit","audit","Audit trail"]],t=[["invoices","invoice","Invoices"],["payments","card","Payments"],["connections","link","Bank connections"],["reports","chart","Reports"]],a=([n,s,l],p=!1)=>`
    <button class="nav-item ${r.activeSection===n?"active":""}" data-scroll="${n}" ${r.activeSection===n?'aria-current="page"':""}>
      ${o(s,18)}<span>${l}</span>
      ${p?'<span class="nav-live">Live</span>':""}
    </button>`;return`
    <aside class="sidebar ${r.mobileNavOpen?"open":""}">
      <div class="sidebar-head">
        <a class="sidebar-brand" href="#overview" data-scroll="overview">
          ${J()}
          <span><strong>Cherry</strong><small>Agent-Native Finance</small></span>
        </a>
        <button class="icon-button sidebar-close" data-action="toggle-nav" aria-label="Close navigation">${o("close",20)}</button>
      </div>

      <div class="workspace-switcher">
        <span class="workspace-avatar">CL</span>
        <span><strong>${c(i.live.connected?i.live.company?.name||"Cherry Money":"Cherry Labs Ltd")}</strong><small>${i.live.connected?"Authenticated production workspace":"Representative sandbox workspace"}</small></span>
        ${o("chevron",16)}
      </div>

      <nav class="sidebar-nav" aria-label="Primary navigation">
        <span class="nav-label">Agent workspace</span>
        ${e.map(n=>a(n)).join("")}
        <span class="nav-label product-label">Cherry Money product</span>
        ${t.map(n=>a(n,!0)).join("")}
      </nav>

      <div class="sidebar-trust">
        <span class="trust-icon">${o("shield",18)}</span>
        <div><strong>Human-controlled by design</strong><small>Agents prepare. People approve.</small></div>
      </div>
      <a class="sidebar-source" href="https://github.com/sohamtech-uk/cherry-webmcp" target="_blank" rel="noreferrer">
        ${o("external",16)} View public source
      </a>
    </aside>
    <button class="nav-scrim ${r.mobileNavOpen?"show":""}" data-action="toggle-nav" aria-label="Close navigation"></button>`}function Ye(){const e=i.webMcpStatus.supported===!0?"ready":i.webMcpStatus.supported===!1?"fallback":"checking",t=i.webMcpStatus.supported===!0?`${i.webMcpStatus.toolCount} tools live`:i.webMcpStatus.supported===!1?"Guided demo available":"Checking WebMCP",n={overview:"Agent workspace",transactions:"Bank transactions",approvals:"Approval queue",tools:"WebMCP tools",audit:"Audit trail",invoices:"Invoices",payments:"Payments",connections:"Bank connections",reports:"Reports"}[r.activeSection]||"Agent workspace";return`
    <header class="topbar">
      <div class="topbar-left">
        <button class="icon-button menu-button" data-action="toggle-nav" aria-label="Open navigation">${o("menu",20)}</button>
        <div class="breadcrumb"><span>Cherry Money</span>${o("chevron",14)}<strong>${c(n)}</strong></div>
      </div>
      <div class="topbar-actions">
        <button class="live-backend-status ${i.live.connected?"connected":i.live.loading?"loading":""}" data-action="${i.live.connected?"disconnect-live":"connect-live"}" title="${i.live.connected?"Disconnect this tab from Cherry Money production":"Connect an authenticated Cherry Money account"}">
          <i></i><span>${c(i.live.connected?i.live.company?.name||"Production connected":i.live.loading?"Connecting…":"Connect Cherry Money")}</span>
        </button>
        <button class="webmcp-status ${e}" data-action="show-tools" title="${c(i.webMcpStatus.message)}">
          <i></i><span>${c(t)}</span>${o("chevron",14)}
        </button>
        <button class="topbar-action" data-action="export-audit" title="Export the human + agent audit trail">${o("download",17)}<span>Audit export</span></button>
        <button class="topbar-action" data-action="reset-demo" title="Reset the representative sandbox">${o("reset",17)}<span>Reset demo</span></button>
        <span class="human-avatar" title="Human controller">SA</span>
      </div>
    </header>`}function Ke(){return`
    <svg class="sparkline" viewBox="0 0 160 48" preserveAspectRatio="none" aria-label="Seven-day balance trend">
      <defs><linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".22"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
      <path class="spark-area" d="M0 39 C18 35 22 27 38 29 S61 35 76 23 102 8 118 15 139 22 160 7 L160 48 L0 48 Z" fill="url(#sparkFill)"/>
      <path d="M0 39 C18 35 22 27 38 29 S61 35 76 23 102 8 118 15 139 22 160 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="160" cy="7" r="3.5" fill="currentColor"/>
    </svg>`}function Qe(e){return`
    <section class="metric-grid" aria-label="Finance overview">
      <article class="metric-card balance-card">
        <div class="metric-head"><span class="metric-icon rose">${o("bank",18)}</span><span>Available cash</span><small>${i.live.connected?"Production":"Live sandbox"}</small></div>
        <strong>${h(e.availableBalance)}</strong>
        <div class="metric-foot"><span class="positive">+8.4%</span><span>vs. last 7 days</span></div>
        ${Ke()}
      </article>
      <article class="metric-card">
        <div class="metric-head"><span class="metric-icon amber">${o("alert",18)}</span><span>Needs review</span></div>
        <strong>${e.reviewCount}</strong>
        <div class="metric-foot"><span>${e.confidentCount} agent-ready</span><span>·</span><span>${e.exceptionCount} exceptions</span></div>
        <div class="mini-progress"><i style="--width:${e.reviewCount?Math.round(e.confidentCount/e.reviewCount*100):0}%"></i></div>
      </article>
      <article class="metric-card">
        <div class="metric-head"><span class="metric-icon green">${o("check",18)}</span><span>Reconciled</span></div>
        <strong>${e.matchedCount}</strong>
        <div class="metric-foot"><span class="positive">Audit-ready</span><span>transactions</span></div>
        <div class="metric-badge">Shared human + agent state</div>
      </article>
      <article class="metric-card attention-card ${e.pendingCount?"has-pending":""}">
        <div class="metric-head"><span class="metric-icon plum">${o("shield",18)}</span><span>Awaiting you</span></div>
        <strong>${e.pendingCount}</strong>
        <div class="metric-foot"><span>${e.pendingCount?"A decision is ready":"Nothing waiting"}</span></div>
        <button class="text-button" data-scroll="approvals">${e.pendingCount?"Review approval":"View safety boundary"} ${o("arrow",15)}</button>
      </article>
    </section>`}function Xe(e){return`
    <section class="hero" id="overview">
      <div class="hero-copy">
        <div class="hero-kicker"><span class="live-dot"></span> OpenAI WebMCP Challenge · Production demo</div>
        <h1>Close the books with an agent.<br/><em>Keep the controls.</em></h1>
        <p>Cherry gives browser agents structured access to bank feeds, invoices and reconciliation logic—then stops at the exact point where human judgement matters.</p>
        <div class="hero-actions">
          <button class="button primary" data-command="guided">${o("sparkles",18)} Run the 60-second guided demo</button>
          <button class="button secondary" data-action="show-tools">${o("agent",18)} Inspect all 7 tools</button>
        </div>
        <div class="hero-proof">
          <span>${o("check",16)} Explainable confidence</span>
          <span>${o("check",16)} Persistent shared state</span>
          <span>${o("check",16)} No autonomous payments</span>
        </div>
      </div>
      <div class="hero-visual" aria-label="Human and agent safety architecture">
        <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
        <div class="agent-core">
          <span>${o("agent",31)}</span>
          <strong>Cherry Agent</strong>
          <small>${e.confidentCount} confident matches ready</small>
        </div>
        <div class="flow-node node-bank">${o("bank",20)}<span>Bank feeds</span></div>
        <div class="flow-node node-invoice">${o("invoice",20)}<span>Invoices</span></div>
        <div class="flow-node node-exception">${o("alert",20)}<span>Exceptions</span></div>
        <div class="human-gate">
          <span>${o("shield",22)}</span>
          <div><strong>Human approval gate</strong><small>Consequential actions stop here</small></div>
        </div>
      </div>
    </section>`}function Ze(){return`
    <footer>
      <div>${J()}<span><strong>Cherry Agent-Native Finance</strong><small>Built after 25 August 2026 for the OpenAI WebMCP Challenge.</small></span></div>
      <div class="footer-links"><a href="https://github.com/sohamtech-uk/cherry-webmcp" target="_blank" rel="noreferrer">Source ${o("external",13)}</a><button data-action="show-tools">Tool registry</button><span>Representative data only</span></div>
    </footer>`}function et(){const e=qe();!e||i.live.connected||(i.live.error=e,r.showLiveLogin=!0,window.history.replaceState(null,"",`${window.location.pathname}${window.location.search}`))}function tt(){return et(),r.showLiveLogin?`
    <button class="modal-scrim" data-action="close-live-login" aria-label="Close Cherry Money connection"></button>
    <section class="modal live-login-modal" role="dialog" aria-modal="true" aria-labelledby="live-login-title">
      <div class="modal-head">
        <div>
          <span class="eyebrow">Authenticated production connection</span>
          <h2 id="live-login-title">Connect this tab to Cherry Money</h2>
          <p>Use your existing Cherry Money account. Google sign-in returns a short-lived, single-use code; no Google or Cherry Money password is stored by this site.</p>
        </div>
        <button class="icon-button" data-action="close-live-login" aria-label="Close">${o("close",20)}</button>
      </div>
      <div class="live-login-form">
        <a class="google-login-button" href="${c(Ee())}">
          <span class="google-mark" aria-hidden="true">G</span>
          <span>Continue with Google</span>
        </a>

        <div class="login-divider"><span>or use email and password</span></div>

        <form id="live-login-form">
          <label><span>Email</span><input name="email" type="email" autocomplete="username" required maxlength="255" placeholder="you@cherrymoney.co.uk" /></label>
          <label><span>Password</span><input name="password" type="password" autocomplete="current-password" required minlength="6" placeholder="Cherry Money password" /></label>
          ${i.live.error?`<div class="live-login-error">${o("alert",17)}${c(i.live.error)}</div>`:""}
          <button class="button primary full" type="submit" ${i.live.loading?"disabled":""}>${o("link",18)} ${i.live.loading?"Connecting…":"Connect securely"}</button>
        </form>
      </div>
      <div class="live-login-foot">
        <span>${o("shield",16)} Google sign-in only connects an existing Cherry Money business user. It does not create a hidden production company.</span>
        <span>${o("lock",16)} The resulting Sanctum token stays in this browser tab. Production finance data is never written to localStorage.</span>
        <code>${c(te)}</code>
      </div>
    </section>`:""}function nt(){if(!i.live.connected)return`
      <div class="live-mode-banner sandbox">
        <span>${o("shield",17)}</span>
        <div><strong>Representative sandbox</strong><small>No production records or OpenAI request is used until an authenticated Cherry Money account is connected.</small></div>
        <button data-action="connect-live">Connect production</button>
      </div>`;const e=i.live.openaiProvider==="openai"?`OpenAI response verified${i.live.model?` · ${i.live.model}`:""}`:i.live.openaiConfigured?`OpenAI configured${i.live.model?` · ${i.live.model}`:""} · not yet called in this tab`:"OpenAI not configured for this company";return`
    <div class="live-mode-banner connected">
      <span>${o("check",17)}</span>
      <div><strong>${c(i.live.company?.name||"Cherry Money production")} connected</strong><small>Authenticated backend · ${c(e)} · tab-scoped session</small></div>
      <button data-action="disconnect-live">Disconnect</button>
    </div>`}function at(){return r.messages.map(e=>`
    <article class="chat-message ${e.role}">
      <div class="chat-avatar">${e.role==="agent"?J():"You"}</div>
      <div class="chat-bubble">
        <div class="chat-meta"><strong>${e.role==="agent"?"Cherry":"Human controller"}</strong><span>${e.time||"now"}</span></div>
        <div class="chat-body">${e.html?e.html:`<p>${c(e.text)}</p>`}</div>
        ${e.tools?.length?`<div class="tool-chain">${e.tools.map(t=>`<span>${o("agent",13)}${c(t)}</span>`).join(o("arrow",14,"tool-arrow"))}</div>`:""}
      </div>
    </article>`).join("")}function ot(){return`
    <section class="panel agent-console" id="tools">
      <div class="panel-header agent-header">
        <div>
          <span class="eyebrow">Shared human + agent workspace</span>
          <h2>${o("sparkles",21)} Ask Cherry through WebMCP</h2>
        </div>
        <span class="secure-pill">${o("lock",14)} Scoped to this page</span>
      </div>
      <div class="prompt-row">
        <button data-command="review">Review transactions</button>
        <button data-command="prepare">${i.live.connected?"Prepare best match":"Prepare txn_001"}</button>
        <button data-command="exceptions">Explain exceptions</button>
        <button data-command="payment">Draft HMRC payment</button>
      </div>
      ${nt()}
      <div class="chat-window" id="chat-window">
        ${at()}
        ${r.agentBusy?`<article class="chat-message agent"><div class="chat-avatar">${J()}</div><div class="chat-bubble typing"><i></i><i></i><i></i><span>Calling scoped finance tools…</span></div></article>`:""}
      </div>
      <form class="composer" id="agent-form">
        <span>${o("sparkles",18)}</span>
        <input name="prompt" maxlength="240" autocomplete="off" placeholder="Ask: what needs review, prepare a match, show exceptions…" aria-label="Ask Cherry" />
        <button type="submit" aria-label="Send prompt">${o("arrow",18)}</button>
      </form>
      <div class="console-foot">
        <span><i class="status-light ${i.webMcpStatus.supported===!0?"on":""}"></i>${i.live.connected?i.live.openaiProvider==="openai"?`OpenAI response verified · ${i.live.model||"configured model"}`:i.live.openaiConfigured?"Cherry Money production connected · OpenAI configured":"Cherry Money production connected · OpenAI unavailable":i.webMcpStatus.supported===!0?"Native WebMCP active":"Guided fallback uses the identical application functions"}</span>
        <button data-action="show-tools">View tool contracts ${o("arrow",14)}</button>
      </div>
    </section>`}function st(){return`
    <article class="panel safety-boundary">
      <div class="panel-header compact">
        <div><span class="eyebrow">Decision architecture</span><h2>${o("shield",20)} Safety boundary</h2></div>
        <span class="grade">A</span>
      </div>
      <p>Each capability has one clear permission level. The agent never inherits blanket access.</p>
      <div class="permission-lanes">
        <div><span class="lane-icon read">${o("search",16)}</span><strong>Inspect</strong><small>Accounts, transactions, invoices</small><b>Read only</b></div>
        <div><span class="lane-icon prepare">${o("sparkles",16)}</span><strong>Prepare</strong><small>Reconciliation and drafts</small><b>Visible state</b></div>
        <div><span class="lane-icon approve">${o("shield",16)}</span><strong>Approve</strong><small>Final financial decision</small><b>Human only</b></div>
      </div>
      <div class="no-execution">${o("lock",17)} <span><strong>No payment execution tool.</strong> The boundary is enforced by capability design, not just a warning.</span></div>
    </article>`}function it(){const e=d.approvals.filter(t=>t.status==="pending");return`
    <article class="panel approval-panel ${e.length?"active":""}" id="approvals">
      <div class="panel-header compact">
        <div><span class="eyebrow">Human decision</span><h2>${o("reconcile",20)} Approval queue</h2></div>
        <span class="count-badge">${e.length}</span>
      </div>
      ${e.length?e.map(t=>{const a=k(t.transactionId),n=O(t.invoiceId);return`
          <div class="approval-item">
            <div class="approval-top"><span class="approval-icon">${o("invoice",19)}</span><div><strong>${c(a?.merchant)} → ${c(n?.number)}</strong><small>${c(t.transactionId)} · staged ${W(t.createdAt)}</small></div><b>${h(t.amount)}</b></div>
            <div class="approval-reason">${o("agent",15)} Prepared by WebMCP agent. No ledger state has changed yet.</div>
            <button class="button primary full" data-approve="${c(t.id)}" ${i.live.connected&&!i.live.capabilities?.humanApproveReconciliation?'disabled title="Your Cherry Money role cannot approve reconciliations"':""}>${o("shield",17)} Approve reconciliation</button>
            <small class="approval-note">This button has no corresponding agent tool.</small>
          </div>`}).join(""):`
        <div class="empty-state compact-empty">
          <span>${o("shield",24)}</span>
          <strong>No staged actions</strong>
          <p>Ask Cherry to prepare txn_001. The proposal will appear here and wait for you.</p>
          <button data-command="prepare">Prepare a safe example ${o("arrow",14)}</button>
        </div>`}
    </article>`}function rt(){const e=d.paymentDrafts[0];return`
    <article class="panel payment-panel" id="payment-safety">
      <div class="panel-header compact">
        <div><span class="eyebrow">Money movement</span><h2>${o("card",20)} Payment safety</h2></div>
        <span class="draft-pill">Draft only</span>
      </div>
      ${e?`
        <div class="payment-draft">
          <div class="draft-heading"><span>${o("bank",18)}</span><div><strong>${c(e.payee)}</strong><small>${c(e.purpose||"Payment draft")}</small></div><b>${h(e.amount)}</b></div>
          <dl><div><dt>Reference</dt><dd>${c(e.reference||"—")}</dd></div><div><dt>Status</dt><dd><span class="status draft_only">Draft only</span></dd></div></dl>
          <div class="money-safe">${o("shield",16)} moneyMoved: <strong>false</strong></div>
        </div>`:`
        <div class="empty-state compact-empty payment-empty">
          <span>${o("lock",24)}</span><strong>No payment drafts</strong><p>An agent may prepare a draft, but cannot send it.</p><button data-command="payment">Create demonstration draft ${o("arrow",14)}</button>
        </div>`}
    </article>`}function ct(){return`
    <section class="workspace-grid">
      ${ot()}
      <aside class="workspace-side">
        ${st()}
        ${it()}
        ${rt()}
      </aside>
    </section>`}function lt(){const e=r.search.trim().toLowerCase(),t=d.transactions.filter(a=>{const n=r.filter==="all"||r.filter==="review"&&a.status==="needs_review"||r.filter==="ready"&&a.status==="needs_review"&&x(a.id).ready||r.filter==="exceptions"&&a.status==="needs_review"&&!x(a.id).ready||a.status===r.filter,s=!e||`${a.id} ${a.merchant} ${a.description}`.toLowerCase().includes(e);return n&&s});return t.length?t.map(a=>{const n=a.status==="needs_review"?x(a.id):null,s=n?.confidence,l=n?.match?`${n.match.invoiceNumber}<small>${n.match.customer}</small>`:n?.suggestedCategory?`${n.suggestedCategory}<small>Expense review</small>`:"—",p=a.direction==="debit"?"−":"+";return`
      <tr class="transaction-row ${a.id===r.selectedTransactionId?"selected":""}" data-open-transaction="${a.id}" tabindex="0">
        <td><span class="transaction-id">${c(a.id)}</span><small>${H(a.bookingDate)}</small></td>
        <td><div class="merchant-cell"><span class="merchant-logo ${a.direction}">${c(a.merchant.slice(0,1))}</span><div><strong>${c(a.merchant)}</strong><small>${c(a.description)}</small></div></div></td>
        <td><span class="direction ${a.direction}">${a.direction}</span></td>
        <td class="amount ${a.direction}">${p}${h(a.amount)}</td>
        <td class="suggested-match">${l}</td>
        <td>${s!==void 0?`<div class="confidence"><span><b>${s}%</b><small>${n.ready?"Confident":n.ambiguous?"Ambiguous":"Review"}</small></span><i><em style="--score:${s}%"></em></i></div>`:'<span class="muted-dash">—</span>'}</td>
        <td><span class="status ${a.status}">${ye(a.status)}</span></td>
      </tr>`}).join(""):'<tr><td colspan="7"><div class="table-empty">No transactions match this view.</div></td></tr>'}function dt(){const e=[["all","All"],["review","Needs review"],["ready","Agent-ready"],["exceptions","Exceptions"],["matched","Matched"]];return`
    <section class="panel transactions-panel" id="transactions">
      <div class="panel-header transactions-head">
        <div><span class="eyebrow">Explainable reconciliation</span><h2>${o("transactions",21)} Bank transactions</h2></div>
        <div class="table-actions">
          <label class="search-box">${o("search",16)}<input data-search-transactions value="${c(r.search)}" placeholder="Search transactions" aria-label="Search transactions" /></label>
          <button class="icon-button" data-action="export-audit" title="Export audit JSON">${o("download",18)}</button>
        </div>
      </div>
      <div class="filter-bar">
        <div class="filter-chips">${e.map(([t,a])=>`<button class="${r.filter===t?"active":""}" data-filter="${t}">${a}</button>`).join("")}</div>
        <span>${d.transactions.length} representative transactions · click a row for evidence</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID / date</th><th>Merchant / reference</th><th>Flow</th><th>Amount</th><th>Agent suggestion</th><th>Confidence</th><th>Status</th></tr></thead>
          <tbody>${lt()}</tbody>
        </table>
      </div>
      <div class="table-footer"><span>${o("lock",14)} Representative data only · no bank credentials</span><button data-command="review">Analyse this queue with Cherry ${o("arrow",14)}</button></div>
    </section>`}function pt(){const e=d.activity.slice(0,6);return`
    <section class="panel audit-panel" id="audit">
      <div class="panel-header compact">
        <div><span class="eyebrow">Accountability</span><h2>${o("audit",20)} Human + agent audit trail</h2></div>
        <button class="text-button" data-action="export-audit">Export JSON ${o("download",14)}</button>
      </div>
      <div class="timeline">
        ${e.map(t=>`
          <article>
            <span class="timeline-icon ${t.kind}">${o(t.actor==="Human"?"shield":t.actor==="Agent"?"agent":"check",16)}</span>
            <div><strong>${c(t.actor)}</strong><p>${c(t.message)}</p><small>${W(t.at)}</small></div>
          </article>`).join("")}
      </div>
    </section>`}function ut(){const e=d.toolActivity.slice(0,6);return`
    <section class="panel tool-activity">
      <div class="panel-header compact">
        <div><span class="eyebrow">Observability</span><h2>${o("agent",20)} Tool invocation log</h2></div>
        <span class="live-label"><i></i> Live</span>
      </div>
      ${e.length?`<div class="tool-log">${e.map(t=>`
        <article><span class="tool-status ${t.status}">${o("check",15)}</span><div><strong>${c(t.toolName)}</strong><p>${c(t.summary)}</p></div><small>${W(t.at)}</small></article>`).join("")}</div>`:`
        <div class="empty-state tool-empty"><span>${o("agent",24)}</span><strong>No tool calls yet</strong><p>Run the guided demo to watch the same contracts an agent uses.</p><button data-command="guided">Start guided demo ${o("arrow",14)}</button></div>`}
    </section>`}function vt(){return`
    <section class="panel decision-flow">
      <div class="panel-header compact"><div><span class="eyebrow">Why this is agent-native</span><h2>${o("rules",20)} One workflow, two interfaces</h2></div></div>
      <p>The human UI and WebMCP tools operate on the same state. There is no shadow automation layer to drift out of sync.</p>
      <div class="flow-diagram">
        <div><span>${o("transactions",18)}</span><strong>Observe</strong><small>Bank feed + invoices</small></div>${o("arrow",17)}
        <div><span>${o("sparkles",18)}</span><strong>Reason</strong><small>Confidence + evidence</small></div>${o("arrow",17)}
        <div><span>${o("reconcile",18)}</span><strong>Prepare</strong><small>Pending action</small></div>${o("arrow",17)}
        <div class="human"><span>${o("shield",18)}</span><strong>Approve</strong><small>Human judgement</small></div>
      </div>
      <div class="architecture-note"><code>document.modelContext.registerTool()</code><span>7 narrowly scoped capabilities</span></div>
    </section>`}function mt(){return`<section class="bottom-grid">${pt()}${ut()}${vt()}</section>`}function ht(){if(!r.selectedTransactionId)return"";const e=k(r.selectedTransactionId);if(!e)return"";const t=e.status==="needs_review"?x(e.id):null,a=d.approvals.find(n=>n.transactionId===e.id&&n.status==="pending");return`
    <button class="drawer-scrim" data-action="close-drawer" aria-label="Close transaction details"></button>
    <aside class="drawer" aria-label="Transaction evidence">
      <div class="drawer-head"><div><span class="eyebrow">Evidence review</span><h2>${c(e.id)}</h2></div><button class="icon-button" data-action="close-drawer" aria-label="Close">${o("close",20)}</button></div>
      <div class="drawer-transaction">
        <span class="merchant-logo ${e.direction}">${c(e.merchant.slice(0,1))}</span>
        <div><strong>${c(e.merchant)}</strong><small>${c(e.description)} · ${H(e.bookingDate,{day:"numeric",month:"long",year:"numeric"})}</small></div>
        <b class="amount ${e.direction}">${e.direction==="debit"?"−":"+"}${h(e.amount)}</b>
      </div>
      ${t?`
        <section class="drawer-section">
          <div class="confidence-hero ${t.ready?"ready":"review"}">
            <span><strong>${t.confidence}%</strong><small>${t.ready?"Ready to stage":t.ambiguous?"Ambiguous":"Human review"}</small></span>
            <div><i><em style="--score:${t.confidence}%"></em></i><p>${c(t.reason)}</p></div>
          </div>
        </section>
        <section class="drawer-section">
          <h3>Evidence signals</h3>
          <div class="signal-list">${t.signals.map(n=>`<span>${o("check",14)}${c(n)}</span>`).join("")}</div>
        </section>
        ${t.candidates?.length?`
          <section class="drawer-section"><h3>${t.ambiguous?"Possible matches":"Proposed invoice"}</h3><div class="candidate-list">
            ${t.candidates.map(n=>`<article class="candidate ${t.match?.invoiceId===n.invoiceId?"best":""}"><span>${o("invoice",18)}</span><div><strong>${c(n.invoiceNumber)}</strong><small>${c(n.customer)} · due ${H(n.dueDate)}</small></div><b>${h(n.amount)}</b>${n.referenceHit?"<em>Reference match</em>":""}</article>`).join("")}
          </div></section>`:""}
        ${t.ready&&!a?`<button class="button primary full drawer-action" data-stage-transaction="${e.id}" data-stage-invoice="${t.match.invoiceId}">${o("sparkles",17)} Stage this match for approval</button>`:""}
        ${a?`<div class="drawer-pending">${o("shield",18)} This match is waiting in the human approval queue.</div>`:""}
      `:`<div class="drawer-complete">${o("check",24)}<strong>${ye(e.status)}</strong><p>This transaction no longer needs agent analysis.</p></div>`}
      <div class="drawer-safety">${o("lock",17)} Opening or analysing this record does not change accounting state.</div>
    </aside>`}function gt(){return r.showToolRegistry?`
    <button class="modal-scrim" data-action="close-tools" aria-label="Close tool registry"></button>
    <section class="modal tool-modal" role="dialog" aria-modal="true" aria-labelledby="tool-modal-title">
      <div class="modal-head"><div><span class="eyebrow">Agent contract surface</span><h2 id="tool-modal-title">Seven deliberately narrow WebMCP tools</h2><p>${c(i.webMcpStatus.message)}</p></div><button class="icon-button" data-action="close-tools" aria-label="Close">${o("close",20)}</button></div>
      <div class="tool-grid">
        ${Ve.map((e,t)=>`
          <article>
            <div class="tool-number">0${t+1}</div>
            <div class="tool-title"><span>${o(e.risk==="guarded"?"shield":"agent",18)}</span><div><strong>${c(e.title)}</strong><code>${c(e.name)}</code></div></div>
            <p>${c(e.description)}</p>
            <div class="tool-tags"><span class="${e.risk}">${c(e.mode)}</span><span>${e.risk==="guarded"?"Visible side effect":"No state change"}</span></div>
          </article>`).join("")}
      </div>
      <div class="modal-safety">${o("shield",19)} <span><strong>Missing on purpose:</strong> approve reconciliation, authorise payment and execute payment. Those capabilities are not agent tools.</span></div>
    </section>`:""}const oe=()=>new Date().toISOString().slice(0,10);function z(e){return e.status==="paid"?"paid":e.dueDate<oe()?"overdue":"outstanding"}function fe(e){const t=z(e);return t==="paid"?"Paid":t==="overdue"?"Overdue":"Outstanding"}function yt(){const e=r.invoiceSearch.trim().toLowerCase();return d.invoices.filter(t=>{const a=z(t),n=r.invoiceFilter==="all"||r.invoiceFilter===a||r.invoiceFilter==="outstanding"&&a!=="paid",s=!e||`${t.number} ${t.customer}`.toLowerCase().includes(e);return n&&s})}function ft(){const e=yt();return e.length?e.map(t=>{const a=z(t),n=a==="paid"?"Settled":`Due ${H(t.dueDate)}`;return`
      <tr class="product-row" data-open-invoice="${c(t.id)}" tabindex="0">
        <td><span class="invoice-number">${c(t.number)}</span><small>${c(t.id)}</small></td>
        <td><div class="customer-cell"><span>${c(t.customer.slice(0,1))}</span><div><strong>${c(t.customer)}</strong><small>${n}</small></div></div></td>
        <td>${h(t.total)}</td>
        <td class="${t.outstanding?"outstanding-money":"settled-money"}">${h(t.outstanding)}</td>
        <td><span class="invoice-status ${a}">${fe(t)}</span></td>
        <td><button class="row-open" aria-label="Open ${c(t.number)}">${o("arrow",16)}</button></td>
      </tr>`}).join(""):'<tr><td colspan="6"><div class="product-empty-row">No invoices match this view.</div></td></tr>'}function bt(){const e=d.invoices.filter(p=>p.status==="unpaid"),t=d.invoices.filter(p=>p.status==="paid"),a=e.filter(p=>p.dueDate<oe()),n=e.reduce((p,u)=>p+Number(u.outstanding),0),s=t.reduce((p,u)=>p+Number(u.total),0),l=[["all","All invoices"],["outstanding","Outstanding"],["overdue","Overdue"],["paid","Paid"]];return`
    <section class="panel product-panel invoices-product" id="invoices">
      <div class="product-heading">
        <div>
          <span class="eyebrow">Cherry Money product</span>
          <h2>${o("invoice",22)} Invoices</h2>
          <p>Track what is due, inspect payment evidence and let Cherry connect receipts to the right invoice.</p>
        </div>
        <button class="button product-primary" data-command="review">${o("sparkles",17)} Match incoming payments</button>
      </div>

      <div class="product-stat-grid">
        <article><span>Outstanding</span><strong>${h(n)}</strong><small>${e.length} unpaid invoices</small></article>
        <article><span>Overdue</span><strong>${a.length}</strong><small>${a.length?"Needs attention":"All on time"}</small></article>
        <article><span>Collected</span><strong>${h(s)}</strong><small>Paid in this sandbox</small></article>
      </div>

      <div class="product-toolbar">
        <div class="product-tabs">${l.map(([p,u])=>`<button class="${r.invoiceFilter===p?"active":""}" data-invoice-filter="${p}">${u}</button>`).join("")}</div>
        <label class="product-search">${o("search",17)}<input data-search-invoices value="${c(r.invoiceSearch)}" placeholder="Search invoices" aria-label="Search invoices" /></label>
      </div>

      <div class="product-table-wrap">
        <table class="product-table invoice-table">
          <thead><tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Outstanding</th><th>Status</th><th></th></tr></thead>
          <tbody>${ft()}</tbody>
        </table>
      </div>
      <div class="product-footer"><span>${o("lock",15)} ${i.live.connected?"Authenticated Cherry Money production data":"Representative invoice data only"}</span><span>Click any invoice to inspect its matching evidence</span></div>
    </section>`}function $t(){return d.paymentDrafts.length?d.paymentDrafts.map(e=>`
    <article class="payment-product-row">
      <span class="payment-product-icon">${o("bank",20)}</span>
      <div><strong>${c(e.payee)}</strong><small>${c(e.purpose||"Payment draft")} · ${c(e.reference||"No reference")}</small></div>
      <b>${h(e.amount)}</b>
      <span class="invoice-status draft">Draft only</span>
      <span class="payment-proof">${o("shield",15)} moneyMoved: false</span>
    </article>`).join(""):`
      <div class="product-zero-state">
        <span>${o("card",26)}</span>
        <div><strong>No payment drafts yet</strong><p>Ask Cherry to prepare an HMRC VAT draft. The agent can populate it, but cannot send it.</p></div>
        <button class="button product-primary" data-command="payment">Create safe demo draft</button>
      </div>`}function wt(){return`
    <section class="panel product-panel payments-product" id="payments">
      <div class="product-heading">
        <div>
          <span class="eyebrow">Cherry Money product</span>
          <h2>${o("card",22)} Payments</h2>
          <p>Prepare payment instructions without exposing an agent capability that can authorise or execute money movement.</p>
        </div>
        <button class="button product-primary" data-command="payment">${o("sparkles",17)} Draft HMRC payment</button>
      </div>

      <div class="payment-policy-strip">
        <div><span>${o("search",18)}</span><strong>Inspect</strong><small>Read finance context</small></div>
        ${o("arrow",18)}
        <div><span>${o("sparkles",18)}</span><strong>Prepare</strong><small>Create visible draft</small></div>
        ${o("arrow",18)}
        <div class="human-step"><span>${o("shield",18)}</span><strong>Authorise</strong><small>Human-controlled process</small></div>
      </div>

      <div class="payment-product-list">${$t()}</div>
      <div class="payment-hard-stop">${o("lock",18)} <div><strong>Execution endpoint intentionally absent</strong><span>No WebMCP tool in this application can approve, authorise or send a payment.</span></div></div>
    </section>`}function Ct(){const e=r.bankSyncAt||new Date().toISOString();return`
    <section class="panel product-panel connections-product" id="connections">
      <div class="product-heading">
        <div>
          <span class="eyebrow">Cherry Money product</span>
          <h2>${o("link",22)} Bank connections</h2>
          <p>See exactly which sandbox accounts are available to the human interface and the page-scoped agent tools.</p>
        </div>
        <button class="button product-secondary" data-action="refresh-connections">${o("reset",17)} Refresh feeds</button>
      </div>

      <div class="connection-health">
        <span class="connection-health-icon">${o("check",22)}</span>
        <div><strong>All sandbox feeds healthy</strong><small>Last checked ${W(e)} · read-only Open Banking representation</small></div>
        <span class="connection-live"><i></i> Connected</span>
      </div>

      <div class="account-product-grid">
        ${d.accounts.map(t=>`
          <article class="account-product-card">
            <div class="account-product-head"><span>${o("bank",21)}</span><span class="connection-live"><i></i> Connected</span></div>
            <strong>${c(t.name)}</strong>
            <small>${c(t.sortCodeMasked)} · ${c(t.provider)}</small>
            <dl><div><dt>Balance</dt><dd>${h(t.balance)}</dd></div><div><dt>Available</dt><dd>${h(t.available)}</dd></div></dl>
            <div class="account-scope">${o("shield",15)} Visible to read-only WebMCP account tools</div>
          </article>`).join("")}
        <article class="connection-add-card">
          <span>${o("link",25)}</span><strong>Connect another bank</strong><p>Disabled in the public challenge sandbox so no banking credentials are requested.</p><button disabled>Sandbox protected</button>
        </article>
      </div>
    </section>`}function B(e,t){return t?Math.max(0,Math.min(100,Math.round(e/t*100))):0}function St(){const e=X(),t=d.invoices.reduce((m,y)=>m+Number(y.outstanding),0),a=d.invoices.filter(m=>m.status==="unpaid"&&m.dueDate<oe()).reduce((m,y)=>m+Number(y.outstanding),0),n=Math.max(0,t-a),s=d.invoices.filter(m=>m.status==="paid").reduce((m,y)=>m+y.total,0),l=d.transactions.length,p=B(e.confidentCount,e.reviewCount),u=B(e.matchedCount,l);return`
    <section class="panel product-panel reports-product" id="reports">
      <div class="product-heading">
        <div>
          <span class="eyebrow">Cherry Money product</span>
          <h2>${o("chart",22)} Reports</h2>
          <p>Translate shared finance state into a concise cash, invoice and reconciliation readiness report.</p>
        </div>
        <div class="product-heading-actions">
          <button class="button product-secondary" data-command="review">${o("sparkles",17)} Analyse with Cherry</button>
          <button class="button product-primary" data-action="export-report">${o("download",17)} Export report</button>
        </div>
      </div>

      <div class="report-highlight-grid">
        <article><span>Available cash</span><strong>${h(e.availableBalance)}</strong><small>Across ${d.accounts.length} connected ${i.live.connected?"production":"sandbox"} accounts</small></article>
        <article><span>Invoice exposure</span><strong>${h(t)}</strong><small>${h(a)} is overdue</small></article>
        <article><span>Agent readiness</span><strong>${p}%</strong><small>${e.confidentCount} of ${e.reviewCount} unresolved items are safe to prepare</small></article>
      </div>

      <div class="report-grid">
        <article class="report-card">
          <div class="report-card-head"><div><span class="eyebrow">Receivables</span><h3>Invoice ageing</h3></div><b>${h(t)}</b></div>
          <div class="report-bars">
            <div><span>Overdue</span><i><em class="overdue" style="--bar:${B(a,t)}%"></em></i><b>${h(a)}</b></div>
            <div><span>Due soon</span><i><em class="soon-bar" style="--bar:${B(n,t)}%"></em></i><b>${h(n)}</b></div>
            <div><span>Paid</span><i><em class="paid" style="--bar:${B(s,t+s)}%"></em></i><b>${d.invoices.filter(m=>m.status==="paid").length}</b></div>
          </div>
        </article>

        <article class="report-card">
          <div class="report-card-head"><div><span class="eyebrow">Reconciliation</span><h3>Control readiness</h3></div><b>${u}%</b></div>
          <div class="readiness-ring" style="--progress:${u*3.6}deg"><span><strong>${e.matchedCount}</strong><small>matched</small></span></div>
          <ul class="report-checks">
            <li>${o("check",15)} ${e.confidentCount} confident matches identified</li>
            <li>${o("alert",15)} ${e.exceptionCount} exceptions need judgement</li>
            <li>${o("shield",15)} ${e.pendingCount} human approvals pending</li>
          </ul>
        </article>

        <article class="report-card report-narrative">
          <div class="report-card-head"><div><span class="eyebrow">Agent summary</span><h3>What matters now</h3></div>${o("sparkles",20)}</div>
          <p>Cherry can prepare the high-confidence receipt matches, surface the ambiguous £680 payment and keep the final accounting decision in the approval queue.</p>
          <button data-command="review">Ask Cherry for the evidence ${o("arrow",15)}</button>
        </article>
      </div>
    </section>`}function xt(){return`
    <section class="product-suite-intro">
      <span class="eyebrow">Connected product surface</span>
      <h2>The Cherry Money links now open real, shared-state workflows.</h2>
      <p>${i.live.connected?"Invoices, payments, bank connections and reports are hydrated from the authenticated Cherry Money backend and share that state with the WebMCP tools.":"Invoices, payments, bank connections and reports all use the same representative finance state as the WebMCP tools."}</p>
    </section>
    ${bt()}
    ${wt()}
    ${Ct()}
    ${St()}`}function kt(){if(!r.selectedInvoiceId)return"";const e=O(r.selectedInvoiceId);if(!e)return"";const t=d.transactions.flatMap(n=>{const s=d.approvals.find(u=>u.transactionId===n.id&&u.invoiceId===e.id);if(s)return[{transaction:n,confidence:s.status==="approved"?100:94,label:s.status==="approved"?"Approved match":"Pending approval"}];if(n.status!=="needs_review")return[];const l=x(n.id);return l.candidates?.find(u=>u.invoiceId===e.id)?[{transaction:n,confidence:l.confidence,label:l.ambiguous?"Possible match":"Suggested match"}]:[]}),a=z(e);return`
    <button class="drawer-scrim" data-action="close-invoice" aria-label="Close invoice details"></button>
    <aside class="drawer product-drawer" aria-label="Invoice details">
      <div class="drawer-head"><div><span class="eyebrow">Invoice workspace</span><h2>${c(e.number)}</h2></div><button class="icon-button" data-action="close-invoice" aria-label="Close">${o("close",20)}</button></div>
      <div class="invoice-drawer-hero">
        <span>${o("invoice",23)}</span>
        <div><strong>${c(e.customer)}</strong><small>Due ${H(e.dueDate,{day:"numeric",month:"long",year:"numeric"})}</small></div>
        <b>${h(e.total)}</b>
      </div>
      <div class="invoice-drawer-stats">
        <div><span>Status</span><strong class="invoice-status ${a}">${fe(e)}</strong></div>
        <div><span>Outstanding</span><strong>${h(e.outstanding)}</strong></div>
      </div>
      <section class="drawer-section">
        <h3>Bank evidence</h3>
        ${t.length?`<div class="invoice-evidence-list">${t.map(({transaction:n,confidence:s,label:l})=>`
          <article><span class="merchant-logo ${n.direction}">${c(n.merchant.slice(0,1))}</span><div><strong>${c(n.id)} · ${c(n.merchant)}</strong><small>${c(n.description)}</small></div><b>${s}%<small>${l}</small></b></article>`).join("")}</div>`:'<div class="invoice-no-evidence">No matching bank evidence has been identified yet.</div>'}
      </section>
      ${e.status==="unpaid"?`<button class="button product-primary full" data-command="review">${o("sparkles",17)} Ask Cherry to analyse receipts</button>`:""}
      <div class="drawer-safety">${o("shield",17)} Invoice state changes only after an explicit human-approved reconciliation.</div>
    </aside>`}const G=document.querySelector("#app"),be=new Set(["overview","transactions","approvals","tools","audit","invoices","payments","connections","reports"]),ce=window.location.hash.replace("#","");be.has(ce)&&(r.activeSection=ce);function v(){const e=X();G.innerHTML=`
    <div class="app-shell">
      ${ze()}
      <div class="main-shell">
        ${Ye()}
        <main>
          ${Xe(e)}
          ${Qe(e)}
          ${ct()}
          ${dt()}
          ${xt()}
          ${mt()}
        </main>
        ${Ze()}
      </div>
      ${ht()}
      ${kt()}
      ${gt()}
      ${tt()}
      <div id="toast-region" class="toast-region" aria-live="polite"></div>
    </div>`,requestAnimationFrame(()=>{const t=document.querySelector("#chat-window");t&&(t.scrollTop=t.scrollHeight)})}function $e(e){r.messages.push({role:"user",text:e,time:new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit"}).format(new Date),tools:[]})}function b(e,t=[]){r.messages.push({role:"agent",html:e,time:new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit"}).format(new Date),tools:t}),r.messages=r.messages.slice(-10)}function Mt(){return r.messages.slice(-8).map(e=>{if(!e.html)return{role:e.role==="agent"?"assistant":"user",content:e.text||""};const t=document.createElement("div");return t.innerHTML=e.html,{role:e.role==="agent"?"assistant":"user",content:t.textContent.trim().slice(0,2e3)}}).filter(e=>e.content)}function At(e){pe(e),i.live.connected=!0,i.live.loading=!1,i.live.company=e.company||null,i.live.user=e.user||De(),i.live.model=e.openai?.model||null,i.live.openaiConfigured=!!e.openai?.configured,i.live.capabilities=e.capabilities||{},i.live.error=null}async function S(){const e=await me();return At(e),e}async function It(e,t){i.live.loading=!0,i.live.error=null,v();try{await Ne(e,t),R(!1);const a=await S();r.messages=[q],r.showLiveLogin=!1,r.activeSection="tools",window.history.replaceState(null,"","#tools"),v(),f(`Connected to ${a.company?.name||"Cherry Money production"}.`)}catch(a){i.live.loading=!1,i.live.connected=!1,i.live.error=a.message,M(),R(!0),U({record:!1}),v()}}async function se({notifyBackend:e=!0}={}){try{e?await Ge():M()}catch{M()}i.live={connected:!1,loading:!1,company:null,user:null,model:null,openaiConfigured:!1,openaiProvider:null,capabilities:{},error:null},R(!0),U({record:!1}),r.messages=[q],f("Disconnected from production. Representative sandbox restored."),v()}function _t(e,t={}){const a=c(String(e||"Ask Cherry did not return a response.")).replaceAll(`
`,"<br>"),s=t.provider==="openai"?"OpenAI API response verified":"Cherry deterministic finance rules";return i.live.openaiProvider=t.provider||i.live.openaiProvider,t.model&&(i.live.model=t.model),`<p>${a}</p><span class="live-ai-proof">${o("check",14)} ${c(s)} · authenticated Cherry Money production${t.model?` · ${c(t.model)}`:""}</span>`}async function Pt(e,t){const a=Mt();$e(t),r.agentBusy=!0,v();try{const n=await je(t,a);if(b(_t(n.reply,n.meta||{}),["cherry_production_context",n.meta?.provider==="openai"?"openai":"cherry_rules"]),e==="prepare"){const l=N().confident[0];if(!l)b("<p>No high-confidence production match is currently safe to stage.</p>",[]);else{const p=await he(l.transaction.id),u=p.suggestion?.match?.invoiceId;if(!u)throw new Error("Cherry Money did not return a valid invoice match.");await ae(l.transaction.id,u),await S(),b(`<p><strong>Prepared—not approved.</strong></p><div class="staged-result">${o("shield",18)}<div><span>${c(l.transaction.id)} → ${c(p.suggestion.match.invoiceNumber)}</span><strong>${h(l.transaction.amount)}</strong><small>Persisted in Cherry Money production · human approval required</small></div></div>`,["cherry_stage_reconciliation"])}}else if(e==="payment"){const s=await ge({payee:"HMRC VAT",amount:1240,reference:"VAT Q2",purpose:"Quarterly VAT payment"});await S(),b(`<p><strong>Production payment draft created.</strong></p><div class="staged-result payment">${o("card",18)}<div><span>${c(s.draft.payee)} · ${c(s.draft.reference)}</span><strong>${h(s.draft.amount)}</strong><small>Draft only · moneyMoved: false</small></div></div>`,["cherry_create_payment_draft"])}else await S()}catch(n){n.status===401?await se({notifyBackend:!1}):(b(`<p><strong>The production request stopped safely.</strong></p><p>${c(n.message)}</p>`,[]),i.live.error=n.message,f(n.message,"error"))}finally{r.agentBusy=!1,v()}}function Tt(e){const t=e.confident.map(({transaction:n,suggestion:s})=>`
    <li><span>${o("check",14)}</span><div><strong>${c(n.id)} → ${c(s.match.invoiceNumber)}</strong><small>${c(s.match.customer)} · ${s.confidence}% confidence</small></div><b>${h(n.amount)}</b></li>`).join(""),a=e.exceptions.map(({transaction:n,suggestion:s})=>`
    <li class="exception"><span>${o("alert",14)}</span><div><strong>${c(n.id)} · ${c(n.merchant)}</strong><small>${c(s.reason)}</small></div><b>${s.confidence}%</b></li>`).join("");return`
    <p><strong>I reviewed the unresolved bank feed against outstanding invoices.</strong></p>
    <div class="agent-summary"><div><span>Confident</span><strong>${e.confident.length}</strong></div><div><span>Exceptions</span><strong>${e.exceptions.length}</strong></div><div><span>Auto-approved</span><strong>0</strong></div></div>
    ${t?`<h4>Ready to prepare</h4><ul class="agent-result-list">${t}</ul>`:""}
    ${a?`<h4>Needs human judgement</h4><ul class="agent-result-list">${a}</ul>`:""}
    <p class="agent-conclusion">I can stage a confident match, but I will not complete it without your approval.</p>`}async function we(e,t=""){if(r.agentBusy)return;const a=t||{guided:"Run the guided reconciliation demo and show me the safety boundary.",review:"Check what needs review and explain the confident matches.",prepare:"Prepare txn_001 against its best invoice match, but do not approve it.",exceptions:"Show me the reconciliation exceptions and explain why they need me.",payment:"Prepare a £1,240 HMRC VAT payment draft with reference VAT Q2. Do not send it."}[e]||"Review the finance workspace.";if(i.live.connected){await Pt(e,a);return}$e(a),r.agentBusy=!0,v(),await new Promise(n=>setTimeout(n,e==="guided"?850:520));try{if(e==="guided"||e==="review"){const n=N();if(w("cherry_get_transactions",{status:"review",limit:25},`Returned ${n.confident.length+n.exceptions.length} unresolved transactions.`),w("cherry_suggest_reconciliation",{batch:!0},`Found ${n.confident.length} confident matches and ${n.exceptions.length} exceptions.`),b(Tt(n),["cherry_get_transactions","cherry_search_invoices","cherry_suggest_reconciliation"]),e==="guided")if(k("txn_001")?.status==="needs_review"){const l=x("txn_001"),p=V("txn_001",l.match.invoiceId);w("cherry_stage_reconciliation",{transaction_id:"txn_001",invoice_id:l.match.invoiceId},"Staged a pending reconciliation; human approval required."),b(`
            <p><strong>I prepared the safest next action.</strong></p>
            <div class="staged-result">${o("shield",18)}<div><span>${c(p.transactionId)} → ${c(O(p.invoiceId).number)}</span><strong>${h(p.amount)}</strong><small>Pending approval · no final reconciliation yet</small></div></div>
            <p>Look at the approval queue: only you can complete this decision.</p>`,["cherry_stage_reconciliation"])}else b("<p>The demonstration match has already been staged or approved. Use <strong>Reset demo</strong> to replay the full journey.</p>",[])}else if(e==="prepare")if(k("txn_001").status==="matched")b("<p><strong>txn_001 is already reconciled.</strong> I did not create a duplicate action. Reset the sandbox to replay it.</p>",["cherry_suggest_reconciliation"]);else{const s=x("txn_001");w("cherry_suggest_reconciliation",{transaction_id:"txn_001"},`${s.confidence}% confidence; ready=${s.ready}.`);const l=V("txn_001",s.match.invoiceId);w("cherry_stage_reconciliation",{transaction_id:"txn_001",invoice_id:s.match.invoiceId},"Reconciliation staged; human approval required."),b(`
          <p><strong>Prepared—not approved.</strong></p>
          <div class="staged-result">${o("shield",18)}<div><span>txn_001 → ${c(O(l.invoiceId).number)}</span><strong>${h(l.amount)}</strong><small>${s.confidence}% confidence · awaiting the human controller</small></div></div>
          <p>I cannot press the approval button. That capability is intentionally absent from the agent contract.</p>`,["cherry_suggest_reconciliation","cherry_stage_reconciliation"])}else if(e==="exceptions"){const n=N();w("cherry_get_exceptions",{},`${n.exceptions.length} exceptions and ${n.pendingApprovals.length} pending approvals.`);const s=n.exceptions.find(({suggestion:l})=>l.ambiguous);b(`
        <p><strong>${n.exceptions.length} items need human judgement.</strong></p>
        <ul class="agent-result-list">${n.exceptions.map(({transaction:l,suggestion:p})=>`<li class="exception"><span>${o("alert",14)}</span><div><strong>${c(l.id)} · ${c(l.merchant)}</strong><small>${c(p.reason)}</small></div><b>${p.confidence}%</b></li>`).join("")}</ul>
        ${s?`<div class="message-callout amber"><span>Why I stopped</span> ${c(s.transaction.id)} matches ${s.suggestion.candidates.length} unpaid invoices for ${h(s.transaction.amount)}. Choosing one would be guessing.</div>`:""}`,["cherry_get_exceptions","cherry_suggest_reconciliation"]),s&&(r.selectedTransactionId=s.transaction.id)}else if(e==="payment"){const n=de({payee:"HMRC VAT",amount:1240,reference:"VAT Q2",purpose:"Quarterly VAT payment"});w("cherry_create_payment_draft",{payee:n.payee,amount:n.amount,reference:n.reference},"Payment draft created; no money moved."),b(`
        <p><strong>Payment draft created with the safety boundary intact.</strong></p>
        <div class="staged-result payment">${o("card",18)}<div><span>${c(n.payee)} · ${c(n.reference)}</span><strong>${h(n.amount)}</strong><small>Draft only · moneyMoved: false</small></div></div>
        <p>There is no WebMCP tool that can authorise or execute this payment.</p>`,["cherry_create_payment_draft"]),f("Payment draft prepared. No money moved.")}}catch(n){b(`<p><strong>I stopped safely.</strong></p><p>${c(n.message)}</p>`,[]),f(n.message,"error")}finally{r.agentBusy=!1,v()}}function Ce(e,t){const a=new Blob([JSON.stringify(t,null,2)],{type:"application/json"}),n=URL.createObjectURL(a),s=document.createElement("a");s.href=n,s.download=e,document.body.append(s),s.click(),s.remove(),URL.revokeObjectURL(n)}function Lt(){Ce(`cherry-human-agent-audit-${new Date().toISOString().slice(0,10)}.json`,Ie()),f("Audit trail exported as JSON.")}function Rt(){const e=X(),t={generatedAt:new Date().toISOString(),environment:"representative sandbox",summary:e,accounts:d.accounts,invoices:d.invoices,reconciliation:N(),paymentDrafts:d.paymentDrafts,safetyBoundary:{paymentExecutionToolExposed:!1,reconciliationApprovalToolExposed:!1,humanApprovalRequired:!0}};Ce(`cherry-finance-report-${new Date().toISOString().slice(0,10)}.json`,t),E("Human","Exported the Cherry Money finance readiness report.","report"),f("Finance report exported as JSON.")}G.addEventListener("click",async e=>{const t=e.target.closest("[data-command]");if(t){t.closest(".product-drawer")&&(r.selectedInvoiceId=null),await we(t.dataset.command);return}const a=e.target.closest("[data-action]");if(a){const g=a.dataset.action;if(g==="connect-live")i.live.error=null,r.showLiveLogin=!0,v();else if(g==="close-live-login")r.showLiveLogin=!1,i.live.error=null,v();else if(g==="disconnect-live")await se();else if(g==="toggle-nav")r.mobileNavOpen=!r.mobileNavOpen,v();else if(g==="show-tools")r.showToolRegistry=!0,v();else if(g==="close-tools")r.showToolRegistry=!1,v();else if(g==="close-drawer")r.selectedTransactionId=null,v();else if(g==="close-invoice")r.selectedInvoiceId=null,v();else if(g==="reset-demo"){if(i.live.connected){await S(),r.messages=[q],v(),f("Production data reloaded. No production record was reset.");return}U(),r.messages=[q],r.selectedTransactionId=null,r.selectedInvoiceId=null,r.invoiceFilter="all",r.invoiceSearch="",r.bankSyncAt=new Date().toISOString(),v(),f("Sandbox reset. The full demo is ready to replay.")}else if(g==="export-audit")Lt();else if(g==="export-report")Rt();else if(g==="refresh-connections"){if(i.live.connected){await S(),v(),f("Reloaded bank connection status from Cherry Money production.");return}r.bankSyncAt=new Date().toISOString(),E("Human","Refreshed the sandbox bank feed status.","sync"),v(),f("Bank feeds refreshed. Both sandbox connections are healthy.")}return}const n=e.target.closest("[data-scroll]");if(n){e.preventDefault();const g=n.dataset.scroll;r.activeSection=g,r.mobileNavOpen=!1,window.history.replaceState(null,"",`#${g}`),v(),requestAnimationFrame(()=>{document.querySelector(`#${CSS.escape(g)}`)?.scrollIntoView({behavior:"smooth",block:"start"})});return}const s=e.target.closest("[data-filter]");if(s){r.filter=s.dataset.filter,v();return}const l=e.target.closest("[data-invoice-filter]");if(l){r.invoiceFilter=l.dataset.invoiceFilter,v();return}const p=e.target.closest("[data-open-invoice]");if(p){r.selectedInvoiceId=p.dataset.openInvoice,r.selectedTransactionId=null,v();return}const u=e.target.closest("[data-open-transaction]");if(u){r.selectedTransactionId=u.dataset.openTransaction,r.selectedInvoiceId=null,v();return}const m=e.target.closest("[data-stage-transaction]");if(m){try{i.live.connected?(await ae(m.dataset.stageTransaction,m.dataset.stageInvoice),await S()):V(m.dataset.stageTransaction,m.dataset.stageInvoice),w("cherry_stage_reconciliation",{transaction_id:m.dataset.stageTransaction,invoice_id:m.dataset.stageInvoice},"Reconciliation staged from evidence drawer; human approval required."),v(),f("Match staged. It is waiting for human approval.")}catch(g){f(g.message,"error")}return}const y=e.target.closest("[data-approve]");if(y)try{if(i.live.connected){if(!i.live.capabilities?.humanApproveReconciliation)throw new Error("Your Cherry Money role cannot approve reconciliations.");await Fe(y.dataset.approve),await S()}else Ae(y.dataset.approve);v(),f("Reconciliation approved by the authenticated human controller.")}catch(g){f(g.message,"error")}});G.addEventListener("keydown",e=>{const t=e.target.closest("[data-open-transaction]");t&&(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),r.selectedTransactionId=t.dataset.openTransaction,r.selectedInvoiceId=null,v());const a=e.target.closest("[data-open-invoice]");a&&(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),r.selectedInvoiceId=a.dataset.openInvoice,r.selectedTransactionId=null,v()),e.key==="Escape"&&(r.showToolRegistry?r.showToolRegistry=!1:r.selectedInvoiceId?r.selectedInvoiceId=null:r.selectedTransactionId?r.selectedTransactionId=null:r.mobileNavOpen&&(r.mobileNavOpen=!1),v())});G.addEventListener("input",e=>{if(e.target.matches("[data-search-transactions]")){const t=e.target.selectionStart;r.search=e.target.value,v(),requestAnimationFrame(()=>{const a=document.querySelector("[data-search-transactions]");a&&(a.focus(),a.setSelectionRange(t,t))});return}if(e.target.matches("[data-search-invoices]")){const t=e.target.selectionStart;r.invoiceSearch=e.target.value,v(),requestAnimationFrame(()=>{const a=document.querySelector("[data-search-invoices]");a&&(a.focus(),a.setSelectionRange(t,t))})}});G.addEventListener("submit",async e=>{if(e.target.id==="live-login-form"){e.preventDefault();const l=new FormData(e.target);await It(String(l.get("email")||"").trim(),String(l.get("password")||""));return}if(e.target.id!=="agent-form")return;e.preventDefault();const t=e.target.elements.prompt,a=t.value.trim();if(!a)return;t.value="";const n=a.toLowerCase(),s=/payment|hmrc|draft/.test(n)?"payment":/exception|ambiguous|uncertain|attention/.test(n)?"exceptions":/prepare|stage|txn_001|reconcile/.test(n)?"prepare":"review";await we(s,a)});window.addEventListener("hashchange",()=>{const e=window.location.hash.replace("#","");be.has(e)&&(r.activeSection=e,v(),requestAnimationFrame(()=>{document.querySelector(`#${CSS.escape(e)}`)?.scrollIntoView({behavior:"smooth",block:"start"})}))});Me(()=>{});window.addEventListener("cherry-live-session-expired",async()=>{(i.live.connected||i.live.loading)&&await se({notifyBackend:!1})});v();if(Oe()){i.live.loading=!0,R(!1),v();try{await S()}catch(e){M(),i.live.loading=!1,i.live.error=e.message,R(!0),U({record:!1})}}try{i.webMcpStatus=await Je({onChange:v})}catch(e){i.webMcpStatus={supported:!1,toolCount:0,message:`WebMCP registration failed safely: ${e.message}`}}v();
