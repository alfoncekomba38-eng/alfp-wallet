const TOKEN = "0xbED72920AE8Ad9e20D1BFBDAEF11D5ebC3c358E3";
const STAKING = "0x86632af9a90dD26ad8D3a5e9Bf71c59ab6101732";
const NFT = "0x0291a26c657480c478911910497057c0816e4d7e";

let provider, signer, account;

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

/* ========== CONNECT WALLET ========== */

async function connectWallet() {

    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    signer = await provider.getSigner();
    account = await signer.getAddress();

    document.getElementById("wallet").innerText =
        "Wallet: " + account;

    loadData();
}

/* ========== LOAD DATA ========== */

async function loadData() {

    const token = new ethers.Contract(TOKEN, tokenABI, signer);
    const nft = new ethers.Contract(NFT, nftABI, signer);

    const bal = await token.balanceOf(account);
    const nftBal = await nft.balanceOf(account);

    document.getElementById("balance").innerText =
        "ALFP: " + ethers.formatUnits(bal, 18);

    document.getElementById("nftBalance").innerText =
        "NFT: " + nftBal;
}

/* ========== STAKE ========== */

async function stake() {

    const amount = document.getElementById("amount").value;
    const plan = document.getElementById("plan").value;

    const token = new ethers.Contract(TOKEN, tokenABI, signer);
    const staking = new ethers.Contract(STAKING, stakingABI, signer);

    const value = ethers.parseUnits(amount, 18);

    await token.approve(STAKING, value);
    const tx = await staking.stake(value, plan);

    await tx.wait();
    alert("Staked!");
}

/* ========== REWARD ========== */

async function checkReward() {

    const staking = new ethers.Contract(STAKING, stakingABI, signer);
    const index = document.getElementById("stakeIndex").value;

    const reward = await staking.pendingReward(account, index);

    document.getElementById("reward").innerText =
        "Reward: " + ethers.formatUnits(reward, 18);
}

/* ========== WITHDRAW ========== */

async function withdraw() {

    const staking = new ethers.Contract(STAKING, stakingABI, signer);
    const index = document.getElementById("stakeIndex").value;

    const tx = await staking.withdrawStake(index);
    await tx.wait();

    alert("Withdraw successful");
}

/* ========== NFT MINT ========== */

async function mintNFT() {

    const uri = document.getElementById("uri").value;

    const nft = new ethers.Contract(NFT, nftABI, signer);

    const tx = await nft.mint(uri);
    await tx.wait();

    alert("NFT Minted");
    loadData();
}

/* ========== BUY NFT ========== */

async function buyNFT() {

    const id = document.getElementById("buyId").value;

    const nft = new ethers.Contract(NFT, nftABI, signer);

    const tx = await nft.buyNFT(id);
    await tx.wait();

    alert("NFT Bought");
    loadData();
}
