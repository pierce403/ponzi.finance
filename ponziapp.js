let provider;
let accounts;

//let contractAddress = "0x0D6c3b9599eccF54819DB6B768B4B77eF3c932A9";
//let contractAddress = "0x167662223C0755eA4310a5E6Cacba557Bfb951a2";
let contractAddress = "0x8416c1863eDEea0E0f0f766CfF1b1800Fdb749aD";
let contract = "";
let accountAddress = "";
let signer;

let abi = [
    "function getBalance() public view returns(uint256 value)",
    "function getLogCount() public view returns (uint256)",
    "function getWealth() public view returns (uint256)",
    "function getWealthAtTime(uint256) public view returns (uint256)",
    "function playerLog(uint256) public view returns (address, uint256, uint256, uint256, uint256)",
    "function players(address) public view returns (uint256, uint256, uint256)",
    "function getAge() public view returns (uint256)",
    "function bumpComp(uint256 count) public returns (uint256)",
    "function compTable(uint256 count) public returns (uint256)",
    "function withdraw() public returns(bool result)"
];

document.getElementById("msg").textContent = 'Please Install Metamask';

ethereum.enable().then(function () {

    provider = new ethers.providers.Web3Provider(web3.currentProvider);

    provider.listAccounts().then(function (result) {
        console.log(result);
        accountAddress = result[0];
        provider.getBalance(String(result[0])).then(function (balance) {
            var etherString = ethers.utils.formatEther(balance);
            console.log("Balance: " + etherString);
            document.getElementById("msg").textContent = 'ETH Balance: ' + etherString;
        });

        signer = provider.getSigner();

        populateTable();
    })
})

function populateTable() {
    console.log("populating table");

    contract = new ethers.Contract(contractAddress, abi, signer);

    contract.getBalance().then(function (value) {
        console.log("Pool Balance: " + value);
        document.getElementById("marketSize").innerText=value/ethers.constants.WeiPerEther+" ETH";
    })

    contract.players(accountAddress).then(function (value) {
        console.log("Deposit: " + value[1]);
        document.getElementById("deposit").innerText=value[1]/ethers.constants.WeiPerEther+" ETH";
    })

    contract.getWealth().then(function (value) {
        console.log("Winnings: " + value);
        document.getElementById("winnings").innerText=value/ethers.constants.WeiPerEther+" ETH";
    })

    

    playerTable = document.getElementById("playerTable");

    contract.getLogCount().then(function (logSize) {
            console.log("looks like " + logSize + " log entries");

            for (let x = 0; x < logSize; ++x) {

                let row=playerTable.insertRow(-1);
                row.insertCell().innerText=x;

                contract.playerLog(x).then(function (value) {
                        console.log("address is " + value[0]);
                        row.insertCell().innerText=value[0];

                        console.log("deposit is " + value[1]);
                        row.insertCell().innerText=(value[1]/ethers.constants.WeiPerEther)+" ETH";

                        console.log("regtime is " + value[2]);
                        row.insertCell().innerText=value[2];

                        if(value[3]==0)
                        {
                            if(value[4]==0)
                            {
                                row.insertCell().innerText="HOPEFUL"
                            }
                            else
                            {
                                row.insertCell().innerText="REKT :-("
                            }
                        }
                        else{
                            row.insertCell().innerText="WON "+((value[1]-value[3])/ethers.constants.WeiPerEther)+" ETH!!";
                        }
                    })
                }
            });
    }