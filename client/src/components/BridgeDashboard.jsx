import React, { useEffect, useState } from "react";
import Button from "./ThemeButton";
import { web3, account } from "./WalletConnect";
import { Contract } from "@ethersproject/contracts";
import { ethers } from "ethers";
import { ToastContainer, toast, cssTransition } from "react-toastify";
import NFTItem from "./NFTItem";
import abi_config from "./contract/config.json";
import EthNFTAbi from "./contract/EthNFT.json";
import BscNFTAbi from "./contract/EthNFT.json";
import "animate.css/animate.min.css";
import "react-toastify/dist/ReactToastify.css";

import { ethToBscRequest, bscToEthRequest } from "./actions/convert";
import { set } from "express/lib/application";

import eth_inventory from "../img/Ethereum-Inventory.svg";

const EthNFTAddress = abi_config.eth_nft;
const BscNFTAddress = abi_config.bsc_nft;

const BridgeDashboard = () => {
  let chainIdBuffer = 0;

  const connectState = localStorage.getItem("isWalletConnected");
  const storedAccount = localStorage.getItem("currentAccount");
  const [account, setAccount] = useState(storedAccount);
  const [value, setValue] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [chainId, setCahinId] = useState(chainIdBuffer);
  var _nftItems = new Array();
  const [nftItems, setNFTItems] = useState(_nftItems);
  const [openInventory, setOpenInventory] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedURI, setSelectedURI] = useState(null);
  const [inventoryOnceOpened, setInventoryOnceOpened] = useState(false);

  web3.eth.setProvider(web3.givenProvider);
  const ethContract = new web3.eth.Contract(EthNFTAbi, EthNFTAddress);
  const bscContract = new web3.eth.Contract(BscNFTAbi, BscNFTAddress);

  const bounce = cssTransition({
    enter: "animate__animated animate__bounceIn",
    exit: "animate__animated animate__bounceOut",
  });

  const isEth = (id) => {
    if(!(id == 1 || id == 4))
      return false;
    else
      return true
  }

  const isBsc = (id) => {
    if(!(id == 56 || id == 97))
      return false;
    else
      return true;
  }

  const inventoryOpen = () => {
    if (
      !localStorage.getItem("isWalletConnected") ||
      !localStorage.getItem("currentAccount")
    ) {
      toast.warning("Please connect your wallet!", {
        transition: bounce,
      });
      return false;
    }
    if(!inventoryOnceOpened) {
      setInventoryOnceOpened(true);
      var itemBuffer = new Array();
      nftItems.map((item, key) => {
        console.log(key)
        itemBuffer.push(<NFTItem key={key} id={item.id} src={item.url} className={item.id == selected ? 'selected-item' : ''} width="90%" onClick={(e) => selectItem(item.id, item.url)}/>);
      })
      setInventoryItems(itemBuffer);
    }
    setOpenInventory(!openInventory);
  }

  const inventoryClose = () => {
    setOpenInventory(!openInventory);
  }

  const selectItem = (id, uri) => {
    const prevElements = Array.from(document.getElementsByClassName('nft-item'));
    prevElements.map((item) => {
      item.style.border = '#a09696';
    })
    setSelected(id);
    setSelectedURI(uri);
    document.getElementById(`nft-item-${id}`).style.backgroundColor = '#fa4444';
  }

  const clearItem = (id) => {
    var i = _nftItems.indexOf(id);
    delete _nftItems[i];
    setInventoryOnceOpened(false);
    setNFTItems(_nftItems);
    inventoryOpen();
    setSelected(null);
    setSelectedURI(null);
    window.location.reload();
  }

  const getEthNFTs = () => {
    if (
      !localStorage.getItem("isWalletConnected") ||
      !localStorage.getItem("currentAccount")
    ) {
      toast.warning("Please connect your wallet!", {
        transition: bounce,
      });
      return false;
    }
    try {
      ethContract.methods.getTokenIdsByAddress(account).call((err, data) => {
        var ids = data.split(",");
        ids.shift();
        ids.map((value, key) => {
          ethContract.methods.tokenURI(value).call((err, data) => {
            console.log(data);
            _nftItems.push({url: `https://gateway.pinata.cloud/ipfs/${data}`, id: value});
            console.log(key, _nftItems);
          });
        });
      });
    } catch (e) {
      toast.error("Network error!", {
        transition: bounce,
      });
    }
  };

  const getBscFNTs = () => {
    if (
      !localStorage.getItem("isWalletConnected") ||
      !localStorage.getItem("currentAccount")
    ) {
      toast.warning("Please connect your wallet!", {
        transition: bounce,
      });
      return false;
    }
    try {
      bscContract.methods.getTokenIdsByAddress(account).call((err, data) => {
        var ids = data.split(",");
        ids.shift();
        ids.map((value, key) => {
          ethContract.methods.tokenURI(value).call((err, data) => {
            console.log(data);
            _nftItems.push({url: `https://gateway.pinata.cloud/ipfs/${data}`, id: value});
            console.log(key, _nftItems);
          });
        });
      });
    } catch (e) {
      toast.error("Network error!", {
        transition: bounce,
      });
    }
  }

  const EthToBsc = async () => {
    if (
      !localStorage.getItem("isWalletConnected") ||
      !localStorage.getItem("currentAccount")
    ) {
      toast.warning("Please connect your wallet!", {
        transition: bounce,
      });
      return false;
    }

    await web3.eth.getChainId().then(id => {
      if(!isEth(id)){
        toast.warning("Switch network to Ethereum.", {
          transition: bounce,
        });
        return false;
      }
    })

    if (!selected) {
      toast.error("Please select item!", {
        transition: bounce,
      });
      return false;
    }
    //Sign message...
    console.log(selected);
    const account = localStorage.getItem("currentAccount");

    await web3.eth.personal
      .sign(web3.utils.sha3(`Sign with id: ${selected}`), account)
      .then(async (e) => {
        console.log(`Item${selected} ETHFloki sent to convert`);
        setProcessing(true);
        await ethToBscRequest(
          account,
          selected,
          selectedURI,
          e,
          web3.utils.sha3(`Sign with id: ${selected}`)
        );
        setProcessing(false);
        clearItem(selected);
      });
  };
  const BscToEth = async () => {
    if (
      !localStorage.getItem("isWalletConnected") ||
      !localStorage.getItem("currentAccount")
    ) {
      toast.warning("Please connect your wallet!", {
        transition: bounce,
      });
      return false;
    }

    await web3.eth.getChainId().then(id => {
      if(!isBsc(id)) {
        toast.warning("Switch network to Binance.", {
          transition: bounce,
        });
        return false;
      }
    })

    if (!selected) {
      toast.error("Please select item!", {
        transition: bounce,
      });
      return false;
    }
    //Sign message...
    const account = localStorage.getItem("currentAccount");

    await web3.eth.personal
      .sign(web3.utils.sha3(`Sign with id: ${selected}`), account)
      .then(async (e) => {
        console.log(`Item${selected} BSCFloki sent to convert`);
        setProcessing(true);
        await bscToEthRequest(
          account,
          selected,
          selectedURI,
          e,
          web3.utils.sha3(`Sign with id: ${selected}`)
        );
        setProcessing(false);
        clearItem(selected);
      });
  };

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  useEffect(() => {
    window.ethereum.on("accountsChanged", (accounts) => {
      setAccount(accounts[0]);
      localStorage.setItem("currentAccount", accounts[0]);
      toast.warning("You changed your account.", {
        transition: bounce,
      });
      clearItem(selected);
      web3.eth.getChainId().then(id => {
        chainIdBuffer = id;
        if(id == 1 || id == 4)
          getEthNFTs();
        else if(id == 56 || id ==97)
          getBscFNTs();
        else
          toast.warning("Switch network to Ethereum or BSC!", {
            transition: bounce,
          });
      })
    });

    window.ethereum.on("networkChanged", (networkId) => {
      setCahinId(networkId);
      console.log(networkId);
      localStorage.setItem("currentNetwork", networkId);
      toast.warning("You changed network.", {
        transition: bounce,
      });
      clearItem(selected);
      web3.eth.getChainId().then(id => {
        chainIdBuffer = id;
        if(id == 1 || id == 4)
          getEthNFTs();
        else if(id == 56 || id ==97)
          getBscFNTs();
        else
          toast.warning("Switch network to Ethereum or BSC!", {
            transition: bounce,
          });
      })
    });

    web3.eth.getChainId().then(id => {
      chainIdBuffer = id;
      if(id == 1 || id == 4)
        getEthNFTs();
      else if(id == 56 || id == 97)
        getBscFNTs();
      else
        toast.warning("Switch network to Ethereum or BSC!", {
          transition: bounce,
        });
    })
  }, []);
  return (
    <div className="dashboard-container flex">
      <div className="bridge-dashboard flex col">
        <div className="nft-items flex">
          <div className="inventory-header flex">
            <div className="css-3d-text2 flex">NFT BRIDGE</div>
          </div>
        </div>
        <div className="dashboard flex col">
          <h2 className="flex">Browse your items in inventory.</h2>
          <div className="input-area flex">
            {/* <input
              type="number"
              min={1}
              className="theme-input"
              placeholder="Input value here..."
              value={value}
              onChange={handleChange}
            /> */}
            <Button
              name={openInventory ? 'Close Inventory' : 'Open Inventory'}
              loading={processing}
              onClick={!openInventory ? inventoryOpen : inventoryClose}
            />
          </div>
        </div>
        <div className="separator flex col">
          <div className="hr"> </div>
        </div>
        <div className="eth-to-bnb flex col">
          <h2 className="flex">Move your Red Floki from Ethereum to Binance</h2>
          <div className="button-area flex">
            <Button
              name="Click here and convert NFT from ETH to BSC"
              loading={processing}
              onClick={EthToBsc}
            />
          </div>
        </div>
        <div className="separator flex col">
          <div className="hr"> </div>
        </div>
        <div className="bnb-to-eth flex col">
          <h2 className="flex">Move your Red Floki from Binance to Ethereum</h2>
          <div className="button-area flex">
            <Button
              name="Click here and convert NFT from BSC to ETH"
              loading={processing}
              onClick={BscToEth}
            />
          </div>
        </div>
      </div>
      <div className={`inventory-panel ${openInventory ? 'inventory-opened' : 'inventory-closed'}   gradient-border flex col`}>
        <div className="inventory-panel-header flex">
          <img alt="ETH INVENTORY" className="eth-inventory" width="100%" src={eth_inventory}/>
        </div>
        <div className="inventory-panel-body flex">
          {inventoryItems}
        </div>
      </div>
    </div>
  );
};

export default BridgeDashboard;
