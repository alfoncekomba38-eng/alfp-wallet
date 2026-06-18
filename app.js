const TOKEN = "0xbED72920AE8Ad9e20D1BFBDAEF11D5ebC3c358E3";
const STAKING = "0x86632af9a90dD26ad8D3a5e9Bf71c59ab6101732";
const NFT = "0x0291a26c657480c478911910497057c0816e4d7e";

let provider;
let signer;
let account;

/* ================= ABIs ================= */

const tokenABI = [
  "function balanceOf(address) view returns(uint256)",
  "function approve(address,uint256) returns(bool)"
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

/* ================= HELPERS ================= */

function shortAddress(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function getError(err) {
  return err?.reason || err?.message || "Transaction failed";
}

/* ================= NETWORK CHECK ================= */

async function checkNetwork() {
  if (!window.ethereum) return;

  const chainId = await window.ethereum.request({ method: "eth_chainId" });

  if (chainId !== "0x38") {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }]
      });
    } catch (err) {
      alert("Please switch manually to BNB Smart Chain");
    }
  }
}

/* ================= CONNECT WALLET ================= */

async function connectWallet() {
  try {

    if (!window.ethereum) {
      alert("Install MetaMask");
      return;
    }

    await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    provider = new ethers.BrowserProvider(window.ethereum);

    signer = await provider.getSigner();
    account = await signer.getAddress();

    await checkNetwork();

    document.getElementById("wallet").innerText =
      "Wallet: " + shortAddress(account);

    await loadData();

  } catch (err) {
    console.error(err);
    alert(getError(err));
  }
}

/* ================= LOAD DATA ================= */

async function loadData() {
  try {
    if (!account) return;

    const token = new ethers.Contract(TOKEN, tokenABI, provider);
    const nft = new ethers.Contract(NFT, nftABI, provider);

    const bal = await token.balanceOf(account);
    const nftBal = await nft.balanceOf(account);

    document.getElementById("balance").innerText =
      "ALFP: " + ethers.formatUnits(bal, 18);

    document.getElementById("nftBalance").innerText =
      "NFT: " + nftBal.toString();

  } catch (err) {
    console.error(err);
  }
}

/* ================= STAKE ================= */

async function stake() {
  try {

    const amount = document.getElementById("amount").value;
    const plan = document.getElementById("plan").value;

    if (!amount || amount <= 0) {
      alert("Enter valid amount");
      return;
    }

    const token = new ethers.Contract(TOKEN, tokenABI, signer);
    const staking = new ethers.Contract(STAKING, stakingABI, signer);

    const value = ethers.parseUnits(amount, 18);

    const approveTx = await token.approve(STAKING, value);
    await approveTx.wait();

    const tx = await staking.stake(value, plan);
    await tx.wait();

    alert("Staked Successfully!");

    await loadData();

  } catch (err) {
    console.error(err);
    alert(getError(err));
  }
}

/* ================= REWARD ================= */

async function checkReward() {
  try {

    const index = document.getElementById("stakeIndex").value;

    const staking = new ethers.Contract(STAKING, stakingABI, provider);

    const reward = await staking.pendingReward(account, index);

    document.getElementById("reward").innerText =
      "Reward: " + ethers.formatUnits(reward, 18) + " ALFP";

  } catch (err) {
    console.error(err);
    alert(getError(err));
  }
}

/* ================= WITHDRAW ================= */

async function withdraw() {
  try {

    const index = document.getElementById("stakeIndex").value;

    const staking = new ethers.Contract(STAKING, stakingABI, signer);

    const tx = await staking.withdrawStake(index);
    await tx.wait();

    alert("Withdraw successful");

    await loadData();

  } catch (err) {
    console.error(err);
    alert(getError(err));
  }
}

/* ================= MINT NFT ================= */

async function mintNFT() {
  try {

    const uri = document.getElementById("uri").value;

    const nft = new ethers.Contract(NFT, nftABI, signer);

    const tx = await nft.mint(uri);
    await tx.wait();

    alert("NFT Minted");

    await loadData();

  } catch (err) {
    console.error(err);
    alert(getError(err));
  }
}

/* ================= BUY NFT ================= */

async function buyNFT() {
  try {

    const id = document.getElementById("buyId").value;

    const nft = new ethers.Contract(NFT, nftABI, signer);

    const tx = await nft.buyNFT(id);
    await tx.wait();

    alert("NFT Bought");

    await loadData();

  } catch (err) {
    console.error(err);
    alert(getError(err));
  }
}

/* ================= AUTO CONNECT ================= */

window.addEventListener("load", async () => {
  try {

    if (!window.ethereum) return;

    provider = new ethers.BrowserProvider(window.ethereum);

    const accounts = await provider.listAccounts();

    if (accounts.length > 0) {
      signer = await provider.getSigner();
      account = await signer.getAddress();

      document.getElementById("wallet").innerText =
        "Wallet: " + shortAddress(account);

      await loadData();
    }

  } catch (err) {
    console.log(err);
  }
});

/* ================= EVENTS ================= */

if (window.ethereum) {

  window.ethereum.on("accountsChanged", () => location.reload());
  window.ethereum.on("chainChanged", () => location.reload());

}

/* ================= AUTO REFRESH ================= */

setInterval(async () => {
  if (account) {
    await loadData();
  }
}, 15000);
