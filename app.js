const TOKEN = "0xbED72920AE8Ad9e20D1BFBDAEF11D5ebC3c358E3";
const STAKING = "0x86632af9a90dD26ad8D3a5e9Bf71c59ab6101732";
const NFT = "0x0291a26c657480c478911910497057c0816e4d7e";
const PAY = "0x24f937cb79931556e6cf8d2901fe2dbb0c0d84f0";

let provider, signer, account;

/* ========== APY CONFIG (LIVE STYLE) ========== */
const PLAN_APY = {
  0: 8,
  1: 12,
  2: 18,
  3: 25
};

/* ========== ABIs ========== */
const tokenABI = [
  "function balanceOf(address) view returns(uint256)",
  "function approve(address,uint256) returns(bool)",
  "function allowance(address,address) view returns(uint256)"
];

const stakingABI = [
  "function stake(uint256,uint8)",
  "function withdrawStake(uint256)",
  "function pendingReward(address,uint256) view returns(uint256)"
];

const nftABI = [
  "function mint(string)",
  "function buyNFT(uint256)",
  "function balanceOf(address) view returns(uint256)"
];

const payABI = [
  "function pay(string,address,uint256)",
  "function merchants(address) view returns(bool)"
];

/* ========== HELPERS ========== */
function shortAddress(a){
  return a.slice(0,6) + "..." + a.slice(-4);
}

function getError(e){
  return e?.reason || e?.message || "Transaction failed";
}

/* ========== UI ========== */
function setUI(addr){
  account = addr;

  document.getElementById("wallet").innerText =
    "Wallet: " + shortAddress(addr);

  const btn = document.querySelector(".connectBtn");
  btn.innerText = "Connected ✅";
  btn.disabled = true;

  renderAPY();
}

/* ========== NETWORK ========== */
async function checkNetwork(){
  const chainId = await window.ethereum.request({ method:"eth_chainId" });

  if(chainId !== "0x38"){
    await window.ethereum.request({
      method:"wallet_switchEthereumChain",
      params:[{ chainId:"0x38" }]
    });
  }
}

/* ========== CONNECT ========== */
async function connectWallet(){
  try{
    if(!window.ethereum) return alert("Install MetaMask");

    await window.ethereum.request({ method:"eth_requestAccounts" });

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    const addr = await signer.getAddress();

    await checkNetwork();
    setUI(addr);
    await loadData();

  }catch(e){
    alert(getError(e));
  }
}

/* ========== LOAD DATA ========== */
async function loadData(){
  if(!account) return;

  const token = new ethers.Contract(TOKEN, tokenABI, provider);
  const nft = new ethers.Contract(NFT, nftABI, provider);

  const bal = await token.balanceOf(account);
  const nftBal = await nft.balanceOf(account);

  document.getElementById("balance").innerText =
    "ALFP: " + Number(ethers.formatUnits(bal,18)).toFixed(4);

  document.getElementById("nftBalance").innerText =
    "NFT: " + nftBal.toString();
}

/* ========== LIVE APY DISPLAY ========== */
function renderAPY(){
  const plan = document.getElementById("plan")?.value || 0;

  const apy = PLAN_APY[plan];

  let el = document.getElementById("apy");

  if(!el){
    el = document.createElement("p");
    el.id = "apy";
    document.querySelector(".card").appendChild(el);
  }

  el.innerText = `🔥 APY: ${apy}% (Live)`;
}

/* ========== SAFE APPROVE ========== */
async function safeApprove(tokenAddr, spender, amount){
  const token = new ethers.Contract(tokenAddr, tokenABI, signer);

  const allowance = await token.allowance(account, spender);

  if(allowance < amount){
    const tx = await token.approve(spender, amount);
    await tx.wait();
  }
}

/* ========== STAKE ========== */
async function stake(){
  try{
    const amount = document.getElementById("amount").value;
    const plan = document.getElementById("plan").value;

    if(!amount) return alert("Enter amount");

    const value = ethers.parseUnits(amount,18);

    await safeApprove(TOKEN, STAKING, value);

    const staking = new ethers.Contract(STAKING, stakingABI, signer);

    const tx = await staking.stake(value, plan);
    await tx.wait();

    alert("🚀 Staked Successfully!");
    await loadData();

  }catch(e){
    alert(getError(e));
  }
}

/* ========== WITHDRAW ========== */
async function withdraw(){
  try{
    const index = document.getElementById("stakeIndex").value;

    const staking = new ethers.Contract(STAKING, stakingABI, signer);

    const tx = await staking.withdrawStake(index);
    await tx.wait();

    alert("💸 Withdraw successful");
    await loadData();

  }catch(e){
    alert(getError(e));
  }
}

/* ========== REWARD ========== */
async function checkReward(){
  try{
    const index = document.getElementById("stakeIndex").value;

    const staking = new ethers.Contract(STAKING, stakingABI, provider);

    const reward = await staking.pendingReward(account, index);

    document.getElementById("reward").innerText =
      "Reward: " + ethers.formatUnits(reward,18) + " ALFP";

  }catch(e){
    alert(getError(e));
  }
}

/* ========== NFT ========== */
async function mintNFT(){
  try{
    const uri = document.getElementById("uri").value;
    const nft = new ethers.Contract(NFT, nftABI, signer);

    const tx = await nft.mint(uri);
    await tx.wait();

    alert("NFT Minted");
    await loadData();

  }catch(e){
    alert(getError(e));
  }
}

async function buyNFT(){
  try{
    const id = document.getElementById("buyId").value;
    const nft = new ethers.Contract(NFT, nftABI, signer);

    const tx = await nft.buyNFT(id);
    await tx.wait();

    alert("NFT Bought");
    await loadData();

  }catch(e){
    alert(getError(e));
  }
}

/* ========== PAY ========== */
async function payMerchant(){
  try{
    const invoiceId = document.getElementById("invoiceId").value.trim();
    const merchant = document.getElementById("merchant").value.trim();
    const amount = document.getElementById("payAmount").value;

    const value = ethers.parseUnits(amount,18);

    await safeApprove(TOKEN, PAY, value);

    const pay = new ethers.Contract(PAY, payABI, signer);

    const tx = await pay.pay(invoiceId, merchant, value);
    await tx.wait();

    alert("Payment Successful!");
    await loadData();

  }catch(e){
    alert(getError(e));
  }
}

/* ========== AUTO CONNECT ========== */
window.addEventListener("load", async () => {
  if(!window.ethereum) return;

  provider = new ethers.BrowserProvider(window.ethereum);

  const accounts = await window.ethereum.request({
    method:"eth_accounts"
  });

  if(accounts.length > 0){
    signer = await provider.getSigner();
    setUI(accounts[0]);
    await loadData();
  }
});

/* ========== EVENTS ========== */
if(window.ethereum){
  window.ethereum.on("accountsChanged", ()=>location.reload());
  window.ethereum.on("chainChanged", ()=>location.reload());
}

/* ========== LIVE REFRESH ========== */
setInterval(()=> {
  if(account) loadData();
}, 10000);
