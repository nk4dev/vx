// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

/// @notice Self-contained ERC-721 collection deployed by `vx3 mint nft` when
/// no contract address is given. Only the deployer (owner) can mint.
/// Compiled into src/nft/collection.ts by scripts/build-nft-artifact.cjs.
contract VXCollection {
    string public name;
    string public symbol;
    address public owner;
    uint256 public totalSupply;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => string) private _tokenURIs;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(string memory name_, string memory symbol_) {
        name = name_;
        symbol = symbol_;
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "VXCollection: caller is not the owner");
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "VXCollection: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC-165
            interfaceId == 0x80ac58cd || // ERC-721
            interfaceId == 0x5b5e139f; // ERC-721 Metadata
    }

    function balanceOf(address account) external view returns (uint256) {
        require(account != address(0), "VXCollection: zero address");
        return _balances[account];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "VXCollection: token does not exist");
        return tokenOwner;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        ownerOf(tokenId);
        return _tokenURIs[tokenId];
    }

    /// @notice Mint the next token (IDs start at 1) to `to` with metadata `uri`.
    function safeMint(address to, string memory uri) external onlyOwner returns (uint256 tokenId) {
        require(to != address(0), "VXCollection: mint to the zero address");
        tokenId = ++totalSupply;
        _owners[tokenId] = to;
        _balances[to] += 1;
        _tokenURIs[tokenId] = uri;
        emit Transfer(address(0), to, tokenId);
        _checkReceiver(address(0), to, tokenId, "");
    }

    function approve(address to, uint256 tokenId) external {
        address tokenOwner = ownerOf(tokenId);
        require(
            msg.sender == tokenOwner || _operatorApprovals[tokenOwner][msg.sender],
            "VXCollection: not owner nor operator"
        );
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        ownerOf(tokenId);
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        require(operator != address(0), "VXCollection: zero address operator");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address account, address operator) external view returns (bool) {
        return _operatorApprovals[account][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        address tokenOwner = ownerOf(tokenId);
        require(tokenOwner == from, "VXCollection: transfer from incorrect owner");
        require(to != address(0), "VXCollection: transfer to the zero address");
        require(
            msg.sender == tokenOwner ||
                _tokenApprovals[tokenId] == msg.sender ||
                _operatorApprovals[tokenOwner][msg.sender],
            "VXCollection: not owner nor approved"
        );
        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        transferFrom(from, to, tokenId);
        _checkReceiver(from, to, tokenId, "");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata data
    ) external {
        transferFrom(from, to, tokenId);
        _checkReceiver(from, to, tokenId, data);
    }

    function _checkReceiver(address from, address to, uint256 tokenId, bytes memory data) private {
        if (to.code.length == 0) return;
        try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
            require(
                retval == IERC721Receiver.onERC721Received.selector,
                "VXCollection: receiver rejected the token"
            );
        } catch {
            revert("VXCollection: transfer to non ERC721Receiver");
        }
    }
}
