export const SunsetRegistryABI = [
  // Constants
  {
    type: "function",
    name: "MIN_COVERAGE_PERIOD",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "INACTIVITY_THRESHOLD",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "MIN_MEANINGFUL_DEPOSIT",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ANNOUNCEMENT_PERIOD",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },

  // Registration
  {
    type: "function",
    name: "register",
    inputs: [
      { name: "token", type: "address" },
      { name: "feeSplitter", type: "address" },
      { name: "tier", type: "uint8" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // Sunset flow
  {
    type: "function",
    name: "announceSunset",
    inputs: [{ name: "token", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "executeSunset",
    inputs: [{ name: "token", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelSunset",
    inputs: [{ name: "token", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // View functions
  {
    type: "function",
    name: "getProject",
    inputs: [{ name: "token", type: "address" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "feeSplitter", type: "address" },
      { name: "tier", type: "uint8" },
      { name: "active", type: "bool" },
      { name: "registeredAt", type: "uint256" },
      { name: "lastMeaningfulDeposit", type: "uint256" },
      { name: "totalDeposited", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSunsetStatus",
    inputs: [{ name: "token", type: "address" }],
    outputs: [
      { name: "announced", type: "bool" },
      { name: "announcedAt", type: "uint256" },
      { name: "announcedBy", type: "address" },
      { name: "executableAt", type: "uint256" },
      { name: "canExecute", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "canOwnerTrigger",
    inputs: [{ name: "token", type: "address" }],
    outputs: [
      { name: "", type: "bool" },
      { name: "", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "canCommunityTrigger",
    inputs: [{ name: "token", type: "address" }],
    outputs: [
      { name: "", type: "bool" },
      { name: "", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRegisteredTokens",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProjectCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isRegistered",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isActive",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vault",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "admin",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },

  // Events
  {
    type: "event",
    name: "ProjectRegistered",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "feeSplitter", type: "address", indexed: false },
      { name: "tier", type: "uint8", indexed: false },
    ],
  },
  {
    type: "event",
    name: "SunsetAnnounced",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "announcedBy", type: "address", indexed: true },
      { name: "executableAt", type: "uint256", indexed: false },
      { name: "reason", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "SunsetExecuted",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "executedBy", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "SunsetCancelled",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "cancelledBy", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "FeeDeposited",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "meaningful", type: "bool", indexed: false },
    ],
  },

  // Errors
  { type: "error", name: "NotRegistered", inputs: [] },
  { type: "error", name: "AlreadyRegistered", inputs: [] },
  { type: "error", name: "NotAuthorized", inputs: [] },
  { type: "error", name: "CoveragePeriodNotMet", inputs: [] },
  { type: "error", name: "StillActive", inputs: [] },
  { type: "error", name: "VaultNotSet", inputs: [] },
  { type: "error", name: "ZeroAddress", inputs: [] },
  { type: "error", name: "SunsetNotAnnounced", inputs: [] },
  { type: "error", name: "AnnouncementPeriodNotMet", inputs: [] },
  { type: "error", name: "SunsetAlreadyAnnounced", inputs: [] },
] as const;
