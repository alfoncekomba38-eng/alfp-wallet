// ================= CONTRACT ADDRESSES =================
const ALFP_ADDRESS = "0xbED72920AE8Ad9e20D1BFBDAEF11D5ebC3c358E3";
const STAKING_ADDRESS = "0xbee1999069e24483ef38f64e1b01759c87369a39";
const NFT_ADDRESS = "0x0291a26c657480c478911910497057c0816e4d7e";

// ================= STATE =================
let provider;
let signer;
let walletAddress;

let alfp;
let staking;
let nft;

// ================= CONNECT WALLET =================
document.getElementById("connectBtn").onclick = async () => {
  if (!window.ethereum) return alert("Install MetaMask");

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);

  signer = provider.getSigner();
  walletAddress = await signer.getAddress();

  document.getElementById("wallet").innerText = walletAddress;

  loadContracts();
  loadBalance();
};

// ================= LOAD CONTRACTS =================
function loadContracts() {
  alfp = new ethers.Contract(
    ALFP_ADDRESS,
    ["function balanceOf(address) view returns (uint256)"],
    signer
  );

  staking = new ethers.Contract(
    STAKING_ADDRESS,
    ["function stake(uint256 amount)", "function claim()"],
    signer
  );

  nft = new ethers.Contract(
    NFT_ADDRESS,
    ["function mint(string uri)"],
    signer
  );
}

// ================= BALANCE =================
async function loadBalance() {
  const bal = await alfp.balanceOf(walletAddress);
  document.getElementById("balance").innerText =
    ethers.utils.formatUnits(bal, 18) + " ALFP";
}

// ================= STAKE =================
async function stake() {
  const amount = document.getElementById("stakeAmount").value;
  if (!amount) return alert("Enter amount");

  const tx = await staking.stake(
    ethers.utils.parseUnits(amount, 18)
  );

  await tx.wait();
  alert("Staked successfully!");
}

// ================= CLAIM =================
async function claim() {
  const tx = await staking.claim();
  await tx.wait();

  alert("Rewards claimed!");
}

// ================= NFT MINT =================
async function mintNFT() {
  const tx = await nft.mint(
    "https://ipfs.io/your-nft-metadata.json"
  );

  await tx.wait();
  alert("NFT Minted!");
}
