// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IToken {
    function bridgeMint(address _owner, string memory _tokenURI, string memory _tokenMeta) external;
    function bridgeBurn(address _owner, uint256 _tokenId) external;
}