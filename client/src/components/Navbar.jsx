import React, { useState } from "react";
import Button from "./ThemeButton";
import logo from "../img/logo.svg";
import Web3 from "web3";
import Web3Modal from "web3modal";
import Authereum from "authereum";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { close } from "./WalletConnect";
import getweb3 from "./WalletConnect";
const Navbar = () => {
  const [web3, setWeb3] = useState(null);
  const isWalletConnected = localStorage.getItem("isWalletConnected");
  const currentAccount = localStorage.getItem("currentAccount");
  const [connectState, setConnecState] = useState(
    isWalletConnected && currentAccount
  );
  const connect = async () => {
    if (!connectState && (!currentAccount || currentAccount == undefined)) {
      setWeb3(getweb3);
      setConnecState(true);
    } else {
      close();
      setConnecState(false);
    }
  };

  return (
    <div className="header flex">
      <div className="header-content flex">
        <div className="logo-container flex">
          <img alt="Red Floki" className="logo flex" src={logo} />
        </div>
        <div className="button-area flex">
          <Button
            name={connectState ? "Disconnect" : "Connect Wallet"}
            onClick={connect}
          />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
