export const SunsetVaultABI = [
  // Constants
  {
    type: "function",
    name: "STANDARD_MULTIPLIER",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "PREMIUM_MULTIPLIER",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "BASIS_POINTS",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },

  // Deposits
  {
    type: "function",
    name: "deposit",
    inputs: [{ name: "token", type: "address" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "depositWETH",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // Claims
  {
    type: "function",
    name: "claim",
    inputs: [{ name: "token", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // View functions
  {
    type: "function",
    name: "getClaimableAmount",
    inputs: [
      { name: "token", type: "address" },
      { name: "holder", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCoverage",
    inputs: [{ name: "token", type: "address" }],
    outputs: [
      { name: "depositedAmount", type: "uint256" },
      { name: "actualBalance", type: "uint256" },
      { name: "snapshotSupply", type: "uint256" },
      { name: "snapshotBlock", type: "uint256" },
      { name: "triggered", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getActualBalance",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTotalCoverage",
    inputs: [],
    outputs: [{ name: "total", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasClaimed",
    inputs: [
      { name: "token", type: "address" },
      { name: "holder", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ethBalances",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registry",
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
    name: "authorizedSplitters",
    inputs: [{ name: "splitter", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },

  // Events
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "newBalance", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "SunsetTriggered",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "actualBalance", type: "uint256", indexed: false },
      { name: "snapshotSupply", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Claimed",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "holder", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "SplitterAuthorized",
    inputs: [
      { name: "splitter", type: "address", indexed: true },
      { name: "authorized", type: "bool", indexed: false },
    ],
  },

  // Errors
  { type: "error", name: "NotAuthorized", inputs: [] },
  { type: "error", name: "NotTriggered", inputs: [] },
  { type: "error", name: "AlreadyClaimed", inputs: [] },
  { type: "error", name: "AlreadyTriggered", inputs: [] },
  { type: "error", name: "NoBalance", inputs: [] },
  { type: "error", name: "TransferFailed", inputs: [] },
  { type: "error", name: "RegistryNotSet", inputs: [] },
] as const;
