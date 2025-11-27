// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
}

contract IonNFTMarketplace {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }
    
    uint256 public nextListingId;
    mapping(uint256 => Listing) public listings;
    uint256 public feePercent = 250; // 2.5%
    address public feeRecipient;
    
    event Listed(uint256 indexed listingId, address indexed seller, address nftContract, uint256 tokenId, uint256 price);
    event Sold(uint256 indexed listingId, address indexed buyer, uint256 price);
    event Canceled(uint256 indexed listingId);
    
    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
    }
    
    function list(address nftContract, uint256 tokenId, uint256 price) external returns (uint256) {
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "NOT_OWNER");
        
        uint256 listingId = nextListingId++;
        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });
        
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        emit Listed(listingId, msg.sender, nftContract, tokenId, price);
        return listingId;
    }
    
    function buy(uint256 listingId) external payable {
        Listing storage listing = listings[listingId];
        require(listing.active, "NOT_ACTIVE");
        require(msg.value == listing.price, "WRONG_PRICE");
        
        listing.active = false;
        
        uint256 fee = listing.price * feePercent / 10000;
        uint256 sellerAmount = listing.price - fee;
        
        payable(listing.seller).transfer(sellerAmount);
        payable(feeRecipient).transfer(fee);
        
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        emit Sold(listingId, msg.sender, listing.price);
    }
    
    function cancel(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "NOT_SELLER");
        require(listing.active, "NOT_ACTIVE");
        
        listing.active = false;
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        emit Canceled(listingId);
    }
}
