let walletAddress = null;
let rewards = 0;

// MetaMask connect
document.getElementById("connectBtn").onclick = async () => {
  if (window.ethereum) {
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    walletAddress = accounts[0];

    document.getElementById("wallet").innerText = walletAddress;

    loadBalance();
  } else {
    alert("Install MetaMask");
  }
};

// Fake ALFP balance (frontend demo)
function loadBalance() {
  document.getElementById("balance").innerText = "1000 ALFP";
}

// Stake function (demo)
function stake() {
  let amount = document.getElementById("stakeAmount").value;

  if (!amount) return alert("Enter amount");

  rewards += Number(amount) * 0.1;

  document.getElementById("rewards").innerText = rewards.toFixed(2);

  alert("Staked " + amount + " ALFP");
}

// Claim rewards
function claim() {
  alert("Claimed " + rewards.toFixed(2) + " ALFP rewards!");
  rewards = 0;
  document.getElementById("rewards").innerText = 0;
}

// NFT functions (mock)
function mintNFT() {
  alert("NFT Minted (demo)");
}

function buyNFT() {
  alert("NFT Purchased (demo)");
}

function stakeNFT() {
  alert("NFT Staked (demo)");
}
