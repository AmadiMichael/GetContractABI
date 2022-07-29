// npm i ethers
const { ethers } = require("ethers");
// npm i dotenv
require("dotenv").config();
// npm i axios
const axios = require("axios");

const ETHERSCAN_APIKEY = process.env.ETHERSCAN_APIKEY;
const POLYGONSCAN_APIKEY = process.env.POLYGONSCAN_APIKEY;
const BSCSCAN_APIKEY = process.env.BSCSCAN_APIKEY;
const AVALANCHE_APIKEY = process.env.AVALANCHE_APIKEY;
const ETHEREUM_PROVIDER = process.env.ETHEREUM_PROVIDER;
const POLYGON_PROVIDER = process.env.POLYGON_PROVIDER;
const BSC_PROVIDER = process.env.BSC_PROVIDER;
const AVALANCHE_PROVIDER = process.env.AVALANCHE_PROVIDER;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

//Array containing needed info for each supported network.
const apiKeyArray = {
  Ethereum: {
    ApiKey: ETHERSCAN_APIKEY,
    Provider: ETHEREUM_PROVIDER,
    ApiNetwork: "api.etherscan.io",
  },
  Polygon: {
    ApiKey: POLYGONSCAN_APIKEY,
    Provider: POLYGON_PROVIDER,
    ApiNetwork: "api.polygonscan.com",
  },
  Bsc: {
    ApiKey: BSCSCAN_APIKEY,
    Provider: BSC_PROVIDER,
    ApiNetwork: "api.bscscan.com",
  },
  Avalanche: {
    ApiKey: AVALANCHE_APIKEY,
    Provider: AVALANCHE_PROVIDER,
    ApiNetwork: "api.snowtrace.io",
  },
};

async function getTokenDetails(tokenContractAddress, chainName) {
  // Get the API Key, RPC provider and Api link prefix for the inputed network.
  const myApiKey = apiKeyArray[chainName].ApiKey;
  const provider = apiKeyArray[chainName].Provider;
  const apiNetwork = apiKeyArray[chainName].ApiNetwork;
  //   Creating a wallet instance with your private key and chosen provider.
  const wallet = new ethers.Wallet(
    PRIVATE_KEY,
    ethers.getDefaultProvider(provider)
  );
  // Assign the wallet's address to a variable for later
  const address = wallet.address;

  //   Check that the inputed address is a valid address.
  if (ethers.utils.isAddress(tokenContractAddress)) {
    let contractABI, decimals, symbol, contractName;
    // Fetch the contract address's abi and connect wallet to it by creating a new Contract instance.
    try {
      let text = await axios(
        `https://${apiNetwork}/api?module=contract&action=getabi&address=${tokenContractAddress}&apikey=${myApiKey}
        `,
        { credentials: "omit" }
      );
      contractABI = JSON.parse(text.data.result);
      let newToken = new ethers.Contract(
        tokenContractAddress,
        contractABI,
        wallet
      );
      // If the contract is a proxy contract this will get the correct info.
      try {
        const implementationAddress = await newToken.implementation();
        console.log("It is a proxy contract");
        console.log(
          "Implementation Contract Address: " + implementationAddress
        );

        let text = await axios(
          `https://${apiNetwork}/api?module=contract&action=getabi&address=${implementationAddress}&apikey=${myApiKey}
          `,
          { credentials: "omit" }
        );
        contractABI = JSON.parse(text.data.result);
        newToken = new ethers.Contract(
          tokenContractAddress,
          contractABI,
          wallet
        );
      } catch (err) {
        console.log(err.message);
        console.log("Not a proxy contract");
      }
      // Get contract name
      contractName = await newToken.name();
      //   Get token symbol
      symbol = await newToken.symbol();
      //   Get token decimals
      decimals = await newToken.decimals();
      //   Get token balance
      let balance = await newToken.balanceOf(address);

      console.log("Contract/Token Name : " + contractName);
      console.log("Contract/Token Symbol : " + symbol);
      console.log("Contract/Token Decimals : " + decimals);
      console.log(
        "Your Balance : " + ethers.utils.formatEther(balance, decimals)
      );
    } catch (err) {
      if (err.message == "Unexpected token C in JSON at position 0") {
        console.log(
          "Not a contract address or contract address not verified on etherscan"
        );
        console.log(err.message);
      } else {
        console.log(err.message);
      }
    }
  } else {
    console.log("Invalid address type");
  }
}

async function test() {
  //example with (POS) Wrapped BTC contract address on Polygon
  await getTokenDetails(
    "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
    "Polygon"
  );
  console.log("--------------------------------------------------------------");
  //example with USD Tether on Avalanche
  await getTokenDetails(
    "0xc7198437980c041c805A1EDcbA50c1Ce5db95118",
    "Avalanche"
  );
  console.log("--------------------------------------------------------------");
  //example with BUSD on Ethereum
  await getTokenDetails(
    "0x5864c777697Bf9881220328BF2f16908c9aFCD7e",
    "Ethereum"
  );
  console.log("--------------------------------------------------------------");
  //example with Wrapped DAI Stablecoin on Binance Smart Chain
  await getTokenDetails("0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3", "Bsc");
}

console.log(test());
