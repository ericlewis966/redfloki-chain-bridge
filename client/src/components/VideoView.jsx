import React from "react";

const VideoView = (props) => {
  return <video autoPlay loop type="video/mp4" {...props}></video>;
};

export default VideoView;
