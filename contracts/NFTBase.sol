// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FlokiNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint16 public constant maxSupply = 12;
    string private _baseTokenURI;    
    uint256 public _startDate = 1634850000000;
    uint256 public _whitelistStartDate = 1634677200000;
    mapping (address => bool) private _whitelisted;
    mapping(address => uint256[]) private _ownerToTokenIds;
    mapping(uint256 => string) private _tokenMetas;

    address public admin;

    struct TokenExtraInfo {
        string metaDataURI;
        bytes32 metaDataHash;
    }

    mapping (uint256 => TokenExtraInfo) public extraInfoMap;

      // Used to correctly support fingerprint verification for the assets
    bytes4 public constant _INTERFACE_ID_ERC721_VERIFY_FINGERPRINT = bytes4(
        keccak256("verifyFingerprint(uint256,bytes32)")
    );

    modifier onlyAdmin {
        require(msg.sender == admin, "only admin");
        _;
    }

    function getMetaDataHash(string memory _metaData) public pure returns (bytes32) {
        bytes32 msgHash = keccak256(abi.encodePacked(_metaData));

        // return prefixed hash, see: eth_sign()
        return keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash)
        );
    }


       function verifyFingerprint(uint256 _tokenId, bytes32 _fingerprint) public view returns (bool) {
        return extraInfoMap[_tokenId].metaDataHash == _fingerprint;
    }


    function setTokenIdsToAddress(address _addr, uint256 _tokenId) public {
        _ownerToTokenIds[_addr].push(_tokenId);
    }


    function uintToString(uint  v) internal pure returns (string memory test){
        bytes memory bstr = new bytes(1);
        bstr[0] = bytes1(uint8(48 + v % 10)); 
        test = string(bstr);
    }

    function getTokenIdsByAddress(address _addr) public view returns(string memory ){
        string memory ret;
        for(uint i = 0; i < _ownerToTokenIds[_addr].length; i++){
            
            string memory temp = uintToString(_ownerToTokenIds[_addr][i]);
            ret = string(abi.encodePacked(ret , ",", temp));
        }
        return ret;
    }

    function updateAdmin (address _newAdmin) public onlyAdmin {
        admin = _newAdmin;
    }

    constructor() ERC721("Red Floki", "Floki") {
        admin = msg.sender;
    }

    function toUint256(bytes memory _bytes) internal pure returns (uint256 value) {
        assembly {
            value := mload(add(_bytes, 0x20))
        }
    }

    function setStartDate(uint256 startDate) public onlyOwner {
        _startDate = startDate;
    }

    function setWhitelistStartDate(uint256 whitelistStartDate) public onlyOwner {
        _whitelistStartDate = whitelistStartDate;
    }


    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }


    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }


    function setBaseURI(string memory _newbaseTokenURI) public onlyOwner {
        _baseTokenURI = _newbaseTokenURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // Get minting limit (for a single transaction) based on current token supply
    function getCurrentMintLimit() public view returns (uint8) {
        return block.timestamp >= _startDate ? 20 : 4;
    }

    // Get ether price based on current token supply
    function getCurrentPrice() public pure returns (uint64) {
        return 100;
    }
    
    function addUserToWhitelist(address wallet) public onlyOwner {
        _whitelisted[wallet] = true;
    }
    
    function removeUserFromWhitelist(address wallet) public onlyOwner {
        _whitelisted[wallet] = false;
    }

    function mint(uint8 _quantityToMint) public payable {
        require(_startDate <= block.timestamp || (block.timestamp >= _whitelistStartDate && _whitelisted[msg.sender] == true), block.timestamp <= _whitelistStartDate ? "Sale is not open" : "Not whitelisted");
        require(_quantityToMint >= 1, "Must mint at least 1");
        require(block.timestamp >= _whitelistStartDate && block.timestamp <= _startDate ? (_quantityToMint + balanceOf(msg.sender) <= 4) : true, "Whitelisted mints are limited to 4 per wallet");
        require(
            _quantityToMint <= getCurrentMintLimit(),
            "Maximum current buy limit for individual transaction exceeded"
        );
        require(
            (_quantityToMint + totalSupply()) <= maxSupply,
            "Exceeds maximum supply"
        );
        require(
            msg.value == (getCurrentPrice() * _quantityToMint),
            "Ether submitted does not match current price"
        );

        for (uint8 i = 0; i < _quantityToMint; i++) {
            _tokenIds.increment();

            uint256 newItemId = _tokenIds.current();
            _mint(msg.sender, newItemId);
        }
    }


    function customMint(string memory _tokenURI, string memory _tokenMeta) public payable {        
        require((totalSupply()) < maxSupply, "Exceeds maximum supply");             
        require(msg.value >= getCurrentPrice(), "Ether submitted does not match current price");         
        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        super._setTokenURI(newItemId, _tokenURI);
        _setTokenMeta(newItemId, _tokenMeta);
        setTokenIdsToAddress(msg.sender, newItemId);
        _tokenIds.increment();
    }

    function bridgeMint (address _owner, string memory _tokenURI, string memory _tokenMeta) public onlyAdmin {
        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        super._setTokenURI(newItemId, _tokenURI);
        _setTokenMeta(newItemId, _tokenMeta);
        setTokenIdsToAddress(_owner, newItemId);
        _tokenIds.increment();
    }

    function bridgeBurn (address _owner, uint256 _tokenId) public onlyAdmin {
        delete _tokenMetas[_tokenId];
        removeTokenIdFromMappingArray(_owner, _tokenId);
        _burn(_tokenId);
    }

    function _setTokenMeta(uint256 _tokenId, string memory _tokenMeta) private{
        require(_exists(_tokenId), "Token Id not exist");
        _tokenMetas[_tokenId] = _tokenMeta;
    }

   function tokenMetaData(uint256 tokenId) external view returns (string memory) {
        require((_exists(tokenId)));
        return _tokenMetas[tokenId];
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function removeTokenIdFromMappingArray(address _owner, uint256 _tokenId) private{
        uint index;
        for(uint256 i = 0; i < _ownerToTokenIds[_owner].length; i++) {
            if(_ownerToTokenIds[_owner][i] == _tokenId) {
                index = i;
                break;
            }
        }

        for (uint256 i = index; i<_ownerToTokenIds[_owner].length-1; i++){
            _ownerToTokenIds[_owner][i] = _ownerToTokenIds[_owner][i+1];
        }
        _ownerToTokenIds[_owner].pop();
    }
}