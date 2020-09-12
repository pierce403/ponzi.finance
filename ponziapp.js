let provider;
let accounts;

let contractAddress = "0xEB82AE50FA5b15FFc2699143b3da1B524127853B";

let contract = "";
let accountAddress = "";
let signer;
let myRegTime = 0;

let abi = [
    "function getBalance() public view returns(uint256 value)",
    "function getLogCount() public view returns (uint256)",
    "function getWealth() public view returns (uint256)",
    "function getWealthAtTime(uint256) public view returns (uint256)",
    "function playerLog(uint256) public view returns (address, uint256, uint256, uint256, uint256)",
    "function players(address) public view returns (uint256, uint256, uint256)",
    "function getAge() public view returns (uint256)",
    "function getTableSize() public view returns (uint256)",
    "function bumpComp(uint256 count) public returns (uint256)",
    "function compTable(uint256 count) public returns (uint256)",
    "function withdraw() public returns(bool result)"
];

document.getElementById("msg").textContent = 'Web3 Browser Required (Metamask etc)';

ethereum.enable().then(function () {

    provider = new ethers.providers.Web3Provider(web3.currentProvider);


    provider.getNetwork().then(function (result) {
        if (result['chainId'] != 1) {
            document.getElementById("msg").textContent = 'Switch to Mainnet!';

        } else { // okay, confirmed we're on mainnet

            provider.listAccounts().then(function (result) {
                console.log(result);
                accountAddress = result[0]; // figure out the user's Eth address

                provider.getBalance(String(result[0])).then(function (balance) {
                    var myBalance = (balance / ethers.constants.WeiPerEther).toFixed(4);
                    console.log("Your Balance: " + myBalance);
                    document.getElementById("msg").textContent = 'Status: Missing Out';
                });

                // get a signer object so we can do things that need signing
                signer = provider.getSigner();

                // build out the table of players
                populateTable();
            })
        }
    })
})

function populateTable() {
    console.log("populating table");

    contract = new ethers.Contract(contractAddress, abi, signer);

    contract.getBalance().then(function (value) {
        console.log("Pool Balance: " + value);
        document.getElementById("marketSize").innerText = (value / ethers.constants.WeiPerEther).toFixed(4) + " ETH";
    })

    contract.players(accountAddress).then(function (value) {
        console.log("Deposit: " + value[1]);
        //document.getElementById("deposit").innerText=value[1]/ethers.constants.WeiPerEther+" ETH";
        myRegTime = value[2];
        refreshButton(value[1]);
    })

    playerTable = document.getElementById("playerTable");
    playerTable.innerHTML = '<thead class="thead-dark"><tr><th scope="col">Player Address</th><th scope="col">Deposit Amount</th><th scope="col">Deposit Time</th><th scope="col">Status</th></tr></thead>'; // wipe the table if there's anything there already

    contract.getLogCount().then(function (logSize) {
        console.log("looks like " + logSize + " log entries");

        for (let x = logSize-1; x >= logSize-viewPlayers && x >= 0; --x) {

            let row = playerTable.insertRow(-1);
            // row.insertCell().innerText = x;  // add the player ID

            contract.playerLog(x).then(function (value) {
                console.log("address is " + value[0]);
                row.insertCell().innerText = value[0];

                console.log("deposit is " + value[1]);
                row.insertCell().innerText = (value[1] / ethers.constants.WeiPerEther) + " ETH";

                console.log("regtime is " + value[2]);
                let regtime = new Date(value[2] * 1000);
                let formatted_date = regtime.getFullYear() + "-" + (regtime.getMonth() + 1) + "-" + regtime.getDate() + " " + regtime.getHours() + ":" + regtime.getMinutes() + ":" + regtime.getSeconds()
                row.insertCell().innerText = formatted_date;

                if (value[3] == 0) { // player still active (no withdraw amount)
                    if (value[4] == 0) {
                        // figure out how much time has passed to calculate gainz
                        let ageSecs = parseInt(Date.now() / 1000) - parseInt(value[2]);
                        let ageHours = parseInt(ageSecs / 60 / 60);
                        let coeff = (10007585 / 10000000) ** ageHours;
                        row.insertCell().innerText = "HOPEFUL (+" + (coeff * 100 - 100).toFixed(2) + "%)";
                    } else {
                        row.insertCell().innerText = "REKT :-("
                    }
                } else {
                    let percentGainz = (value[3] / value[1] * 100 - 100).toFixed(2);
                    row.insertCell().innerText = "WON (+" + percentGainz + "%)";
                }
            })
        }
    });
}

function refreshButton(deposit) {
    if (deposit == 0) { // if the user has no money in game, show Deposit UX
        document.getElementById("bigRedButton").innerText = "Deposit ETH";
        document.getElementById("bigRedButton").onclick = function () {
            console.log("WOAW DEPOSIT");

            //document.cookie = "educated=1";

            if (document.cookie !== "educated=1") {
                console.log("GET SOME EDUCATION");
                $('#gameModal').modal({
                    show: true
                });
                return;
            }

            let depositValue = ethers.utils.parseEther(document.getElementById("depositInput").value);
            console.log("Depositing " + depositValue + " ETH");
            console.log("From " + accountAddress);
            let tx = {
                to: contractAddress,
                value: depositValue
            };
            //signer.send('eth_sendTransaction', tx);
            signer.sendTransaction(tx);
        }
        document.getElementById("winnings").innerHTML = "<div class=\"input-group input-group-sm mb-3 col-6\">\r\n  <input id=\"depositInput\" width=200 value=\"0.1\" type=\"text\" class=\"form-control\" aria-label=\"Small\" aria-describedby=\"inputGroup-sizing-sm\">\r\n<\/div>";

    } else { // if the user has money in the game, show Withdrawl UX

        if(!requireAge())return;

        document.getElementById("bigRedButton").innerText = "Withdraw ETH";
        document.getElementById("bigRedButton").onclick = function () {

            // are we past the 24 hour waiting period?
            if (myRegTime * 1000 + 24 * 60 * 60 * 1000 >= Date.now()) {
                // how much time is left?
                let remainingSecs = (parseInt(myRegTime) + 24 * 60 * 60) - (Date.now() / 1000);
                let remainingHours = parseInt((remainingSecs / 60 / 60));
                let remainingMins = parseInt(remainingSecs / 60 - remainingHours * 60);

                document.getElementById("msg").textContent = "You must wait " + remainingHours + " hours " + remainingMins + " mins before withdrawing.";
                return;
            }

            contract.withdraw().then(function (value) {
                if (value) {
                    console.log("Withdraw Successful");
                } else {
                    document.getElementById("msg").textContent = "Dang";
                    console.log("Oh No Withdraw Failure :-(");
                }
            })
        }
        contract.getWealth().then(function (value) {
            let percentGainz = (value / deposit * 100 - 100).toFixed(2);
            document.getElementById("winnings").innerText = (value / ethers.constants.WeiPerEther).toFixed(4) + " ETH (+" + percentGainz + "%)";
        })

    }
}

function requireAge()
{
    contract.getAge().then(function(age){
      console.log("age is "+age);
      contract.getTableSize().then(function(tableSize){
        console.log("tableSize is "+tableSize);

        if(tableSize<age){
            console.log("OH NOO");

            document.getElementById("msg").textContent = 'WARNING: Table size behind by '+(age-tableSize)+' hours!';

            document.getElementById("bigRedButton").innerText = "Build Table";
            document.getElementById("bigRedButton").onclick = function () {
    
                contract.bumpComp(200).then(function (value) {
                    if (value) {
                        console.log("Bump Successful");
                    } else {
                        console.log("Bump Failed");
                    }
                })
            }

        }
        else{
            console.log("OH YEAH")
        }
      });
    });

    return true;
}

function iUnderstand() {
    document.cookie = "educated=1";
}