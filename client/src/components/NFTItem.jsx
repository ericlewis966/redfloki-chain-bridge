import React from "react";
import VideoView from "./VideoView";
import Button from "./ThemeButton";

const NFTItem = (props) => {
  return (
    <div id={`nft-item-${props.id}`} className={`nft-item ${props.className} flex col`} onClick={props.onClick}>
      <div className="video-view flex">
        <VideoView className="video-preview flex" width={props.width} src={props.src} />
      </div>
      {/* <Button className="select-button" name={'SELECT THIS NFT'} onClick={props.onClick}/> */}
    </div>
  );
};

export default NFTItem;
