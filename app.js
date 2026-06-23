const TOKEN = "0xbED72920AE8Ad9e20D1BFBDAEF11D5ebC3c358E3";
const STAKING = "0x86632af9a90dD26ad8D3a5e9Bf71c59ab6101732";
const NFT = "0x0291a26c657480c478911910497057c0816e4d7e";
const PAY = "0x24f937cb79931556e6cf8d2901fe2dbb0c0d84f0";

let provider, signer, account;

/* ========== STATE ========== */
let refreshInterval;

/* ========== APY ========== */
const PLAN_APY = { 0: 8, 1: 12, 2: 18, 3: 25 };

/* ========== ABIs ========== */
const tokenABI = [
  "function balanceOf(address) view returns(uint256)",
  "function approve(address,uint256) returns(bool)",
  "function allowance(address,address) view returns(uint256)"
];

const stakingABI = [
  "function stake(uint256,uint8)",
  "function withdrawStake(uint256)",
  "function pendingReward(address,uint256) view returns(uint256)",
  "function referralRewards(address) view returns(uint256)",
  "function totalReferrals(address) view returns(uint256)",
  "function claimReferral()"
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
function shortAddress(a) {
  return a.slice(0, 6) + "..." + a.slice(-4);
}

function getError(e) {
  console.error(e);
  return (e?.reason || e?.message || "Transaction failed").slice(0, 120);
}

/* ========== UI ========== */
async function setUI(addr) {
  account = addr;

  document.getElementById("wallet").innerText =
    "Wallet: " + shortAddress(addr);

  const btn = document.querySelector(".connectBtn");
  btn.innerText = "Connected ✅";
  btn.disabled = true;

  renderAPY();

  await Promise.all([loadData(), loadReferralData()]);
  startAutoRefresh();
}

/* ========== NETWORK ========== */
async function checkNetwork() {
  const chainId = await window.ethereum.request({ method: "eth_chainId" });

  if (chainId !== "0x38") {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x38" }]
    });
  }
}

/* ========== CONNECT ========== */
async function connectWallet() {
  try {
    if (!window.ethereum) return alert("Install MetaMask");

    await window.ethereum.request({ method: "eth_requestAccounts" });

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    const addr = await signer.getAddress();

    await checkNetwork();
    await setUI(addr);

  } catch (e) {
    alert(getError(e));
  }
}

/* ========== LOAD DATA ========== */
async function loadData() {
  if (!account) return;

  const token = new ethers.Contract(TOKEN, tokenABI, provider);
  const nft = new ethers.Contract(NFT, nftABI, provider);

  const [bal, nftBal] = await Promise.all([
    token.balanceOf(account),
    nft.balanceOf(account)
  ]);

  document.getElementById("balance").innerText =
    "ALFP: " + Number(ethers.formatUnits(bal, 18)).toFixed(4);

  document.getElementById("nftBalance").innerText =
    "NFT: " + nftBal.toString();
}

/* ========== REFERRAL ========== */
async function loadReferralData() {
  try {
    if (!account) return;

    const staking = new ethers.Contract(STAKING, stakingABI, provider);

    const rewards = await staking.referralRewards(account);
    const total = await staking.totalReferrals(account);

    const url = new URL(window.location.href);
    url.searchParams.set("ref", account);

    const link = url.toString();

    document.getElementById("myRefLink").innerText =
      "Referral Link: " + link;

    document.getElementById("refCode").innerText =
      "Referral Code: " + shortAddress(account);

    document.getElementById("totalRefs").innerText =
      "Total Referrals: " + total.toString();

    document.getElementById("refRewards").innerText =
      "Referral Rewards: " +
      Number(ethers.formatUnits(rewards, 18)).toFixed(4) +
      " ALFP";

  } catch (e) {
    console.log(e);
  }
}

function copyReferralLink() {
  const txt = document
    .getElementById("myRefLink")
    .innerText
    .replace("Referral Link: ", "");

  navigator.clipboard.writeText(txt);
  alert("Copied!");
}

async function claimReferralReward() {
  try {
    const staking = new ethers.Contract(STAKING, stakingABI, signer);

    const tx = await staking.claimReferral();
    await tx.wait();

    alert("Claimed!");
    await loadReferralData();

  } catch (e) {
    alert(getError(e));
  }
}

/* ========== APY ========== */
function renderAPY() {
  const plan = document.getElementById("plan")?.value || 0;

  document.getElementById("apy").innerText =
    `🔥 APY: ${PLAN_APY[plan]}%`;
}

/* ========== SAFE APPROVE ========== */
async function safeApprove(tokenAddr, spender, amount) {
  const token = new ethers.Contract(tokenAddr, tokenABI, signer);

  const allowance = await token.allowance(account, spender);

  const allowanceBN = BigInt(allowance.toString());
  const amountBN = BigInt(amount.toString());

  if (allowanceBN < amountBN) {
    const tx = await token.approve(spender, amountBN);
    await tx.wait();
  }
}

/* ========== STAKE ========== */
async function stake() {
  try {
    const amount = document.getElementById("amount").value;
    const plan = document.getElementById("plan").value;

    const value = ethers.parseUnits(amount, 18);

    await safeApprove(TOKEN, STAKING, value);

    const staking = new ethers.Contract(STAKING, stakingABI, signer);

    const tx = await staking.stake(value, plan);
    await tx.wait();

    alert("Staked Successfully!");
    await loadData();

  } catch (e) {
    alert(getError(e));
  }
}

/* ========== WITHDRAW ========== */
async function withdraw() {
  try {
    const index = document.getElementById("stakeIndex").value;

    const staking = new ethers.Contract(STAKING, stakingABI, signer);

    const tx = await staking.withdrawStake(index);
    await tx.wait();

    alert("Withdraw successful");
    await loadData();

  } catch (e) {
    alert(getError(e));
  }
}

/* ========== REWARD CHECK ========== */
async function checkReward() {
  try {
    const index = document.getElementById("stakeIndex").value;

    const staking = new ethers.Contract(STAKING, stakingABI, provider);

    const reward = await staking.pendingReward(account, index);

    document.getElementById("reward").innerText =
      "Reward: " +
      ethers.formatUnits(reward, 18) +
      " ALFP";

  } catch (e) {
    alert(getError(e));
  }
}

/* ========== AUTO REFRESH ========== */
function startAutoRefresh() {
  if (refreshInterval) clearInterval(refreshInterval);

  refreshInterval = setInterval(() => {
    if (!account) return;

    loadData().catch(()=>{});
    loadReferralData().catch(()=>{});
  }, 10000);
}

/* ========== AUTO LOAD ========== */
window.addEventListener("load", async () => {
  if (!window.ethereum) return;

  provider = new ethers.BrowserProvider(window.ethereum);

  const accounts = await window.ethereum.request({
    method: "eth_accounts"
  });

  if (accounts.length > 0) {
    signer = await provider.getSigner();
    await setUI(accounts[0]);
  }
});

/* ========== EVENTS ========== */
if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => location.reload());
  window.ethereum.on("chainChanged", () => location.reload());
}
