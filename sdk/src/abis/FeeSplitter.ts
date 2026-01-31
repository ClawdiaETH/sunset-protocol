export const FeeSplitterABI = [
  // State
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "sunsetVault",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "token",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "weth",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "sunsetBps",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_BPS",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MAX_SUNSET_BPS",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },

  // Core functions
  {
    type: "function",
    name: "claimAndSplitWETH",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimAndSplitETH",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimAndSplitToken",
    inputs: [{ name: "feeToken", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // Owner functions
  {
    type: "function",
    name: "setSunsetBps",
    inputs: [{ name: "newBps", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setOwner",
    inputs: [{ name: "newOwner", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "rescueTokens",
    inputs: [
      { name: "_token", type: "address" },
      { name: "to", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // Events
  {
    type: "event",
    name: "FeesClaimed",
    inputs: [
      { name: "feeToken", type: "address", indexed: true },
      { name: "projectAmount", type: "uint256", indexed: false },
      { name: "sunsetAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "SunsetBpsUpdated",
    inputs: [
      { name: "oldBps", type: "uint256", indexed: false },
      { name: "newBps", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "OwnerUpdated",
    inputs: [
      { name: "oldOwner", type: "address", indexed: true },
      { name: "newOwner", type: "address", indexed: true },
    ],
  },

  // Errors
  { type: "error", name: "ZeroAddress", inputs: [] },
  { type: "error", name: "InvalidBps", inputs: [] },
  { type: "error", name: "OnlyOwner", inputs: [] },
  { type: "error", name: "TransferFailed", inputs: [] },
] as const;
