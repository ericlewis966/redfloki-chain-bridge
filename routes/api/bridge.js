const fs = require('fs');
const express = require('express');
const router = express.Router();
const { ethers, BigNumber } = require('ethers');
const ethUtil = require('ethereumjs-util');

const BridgeEth = require("../../client/src/components/contract/EthBridge.json");
const BridgeBsc = require("../../client/src/components/contract/BridgeBsc.json");
const addresses = require("../../client/src/components/contract/config.json");
const eth_bridge = addresses.eth_bridge;
const bsc_bridge = addresses.bsc_bridge;
const net_config = require("../../net.config.json");

const ethnet = net_config.eth_url;
const bscnet = net_config.bsc_url;
const eth_provider = new ethers.providers.JsonRpcProvider(ethnet);
const bsc_provider = new ethers.providers.JsonRpcProvider(bscnet);
const eth_contract = new ethers.Contract(eth_bridge, BridgeEth, eth_provider);
const bsc_contract = new ethers.Contract(bsc_bridge, BridgeBsc, bsc_provider);

var privateKey = fs.readFileSync('./secret', 'utf-8');

const adminaccount = {
  publicKey: net_config.admin_public_key,
  privateKey: privateKey
}

console.log(`Admin account is ${adminaccount.publicKey}`);

const adminEthWallet = new ethers.Wallet(adminaccount.privateKey, eth_provider);
const adminBscWallet = new ethers.Wallet(adminaccount.privateKey, bsc_provider);

const signedEthContract = eth_contract.connect(adminEthWallet);
const signedBscContract = bsc_contract.connect(adminBscWallet);

// const sig = "0x6162636400000000000000000000000000000000000000000000000000000000";

router.post('/eth2bsc', async (req, res) => {
  var account = req.body.account;
  var amount = req.body.amount;
  var signature = req.body.signature;
  var msg = req.body.hash;

  const isValidAddress = ethUtil.isValidAddress(account);
  const isValidAmount = amount > 0;
  const isValidSign = ethUtil.isHexPrefixed(String(signature));
  const isValidHash = ethUtil.isHexPrefixed(String(msg));

  if (!(isValidAddress && isValidAmount && isValidSign && isValidHash)) {
    return res.status(500).json({ step: 1, message: `Security error! Server received invalid prams!${isValidAddress}, ${amount}, ${isValidSign}, ${isValidHash}` });
  }

  var msgBuffer = '';
  var msgHash = '';
  var signatureBuffer = '';

  try {
    msgBuffer = ethUtil.toBuffer(msg);
    msgHash = ethUtil.hashPersonalMessage(msgBuffer);
    signatureBuffer = ethUtil.toBuffer(signature);
  } catch (e) {
    return res.status(500).json({ step: 1, message: 'Security error! Request with invalid params!' })
  }


  const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
  const publicKey = ethUtil.ecrecover(msgHash, signatureParams.v, signatureParams.r, signatureParams.s);
  const adddressBuffer = ethUtil.publicToAddress(publicKey);
  const address = ethUtil.bufferToHex(adddressBuffer);

  console.log(`recvered address is ${address}`);

  const isMatched = account.toLowerCase() == address.toLowerCase();

  if (!isMatched) {
    return res.status(500).json({ step: 1, message: 'Security error! Transaction caller is not signer!' })
  }

  console.log(`I will burn BSCFloki from ${account}`)
  try {
    var tx = await signedEthContract.burn(account, BigNumber.from(String(amount * Math.pow(10, 18))))
    console.log(tx.hash);
    console.log("First transaction successed(ETHFloki burned)");
  } catch (e) {
    console.log("Transaction to burn ETHFloki faild");
    return res.status(500).json({ step: 1, message: 'Transaction Faild! \nCheck your account and token balance.' })
  }
  console.log(`I will mint BSCFloki to ${account}`)
  try {
    var tx1 = await signedBscContract.mint(account, account, BigNumber.from(String(amount * Math.pow(10, 18))));
    console.log(tx1.hash);
    console.log("Second transaction successed(BSCFloki minted)");
  } catch (e) {
    console.log("Transanction to mint BSCFloki faild");
    return res.status(500).json({ step: 2, message: 'Transaction Faild! \nCheck your account.' })
  }
  return res.send(`Success! \n ${amount} ETHFloki converted to ${amount} BSCFloki in your wallet.`);
});


router.post('/bsc2eth', async (req, res) => {
  var account = req.body.account;
  var amount = req.body.amount;
  var signature = req.body.signature;
  var msg = req.body.hash;

  const isValidAddress = ethUtil.isValidAddress(account);
  const isValidAmount = amount > 0;
  const isValidSign = ethUtil.isHexPrefixed(String(signature));
  const isValidHash = ethUtil.isHexPrefixed(String(msg));

  if (!(isValidAddress && isValidAmount && isValidSign && isValidHash)) {
    return res.status(500).json({ step: 1, message: 'Security error! Server received invalid prams!' });
  }

  var msgBuffer = '';
  var msgHash = '';
  var signatureBuffer = '';

  try {
    msgBuffer = ethUtil.toBuffer(msg);
    msgHash = ethUtil.hashPersonalMessage(msgBuffer);
    signatureBuffer = ethUtil.toBuffer(signature);
  } catch (e) {
    return res.status(500).json({ step: 1, message: 'Security error! Request with invalid params!' })
  }

  const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
  const publicKey = ethUtil.ecrecover(msgHash, signatureParams.v, signatureParams.r, signatureParams.s);
  const adddressBuffer = ethUtil.publicToAddress(publicKey);
  const address = ethUtil.bufferToHex(adddressBuffer);

  console.log(`recvered address is ${address}`);

  const isMatched = account.toLowerCase() == address.toLowerCase();

  if (!isMatched) {
    return res.status(500).json({ step: 0, message: 'Security error! Transaction caller is not signer!' })
  }

  console.log(`I will burn BSCFloki from ${account}`)
  try {
    var tx = await signedBscContract.burn(account, BigNumber.from(String(amount * Math.pow(10, 18))))
    console.log(tx.hash);
    console.log("First transaction successed(BTK burned)");
  } catch (e) {
    console.log("Transaction to burn ETHFloki faild");
    return res.status(500).json({ step: 1, message: 'Transaction Faild! \nCheck your account and token balance.' })
  }
  console.log(`I will mint ETHFloki to ${account}`)
  try {
    var tx1 = await signedEthContract.mint(account, account, BigNumber.from(String(amount * Math.pow(10, 18))));
    console.log(tx1.hash);
    console.log("Second transaction successed(ETHFloki minted)");
  } catch (e) {
    console.log("Transaction to mint ETHFloki faild");
    return res.status(500).json({ step: 2, message: 'Transaction Faild! \nCheck your account.' })
  }
  return res.send(`Success! \n ${amount} BSCFloki converted to ${amount} ETHFloki in your wallet.`);
});

module.exports = router;
