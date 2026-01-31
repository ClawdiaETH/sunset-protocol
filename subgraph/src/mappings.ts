import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  ProjectRegistered,
  SunsetAnnounced,
  SunsetExecuted,
  SunsetCancelled,
  FeeDeposited,
} from "../generated/SunsetRegistry/SunsetRegistry";
import {
  Deposited,
  SunsetTriggered,
  Claimed,
} from "../generated/SunsetVault/SunsetVault";
import { Project, Deposit, Claim, SunsetEvent, Protocol } from "../generated/schema";

// ============ Helper Functions ============

function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load("sunset-protocol");
  if (protocol == null) {
    protocol = new Protocol("sunset-protocol");
    protocol.totalProjects = BigInt.fromI32(0);
    protocol.activeProjects = BigInt.fromI32(0);
    protocol.sunsettedProjects = BigInt.fromI32(0);
    protocol.totalDeposited = BigInt.fromI32(0);
    protocol.totalClaimed = BigInt.fromI32(0);
    protocol.save();
  }
  return protocol;
}

function getOrCreateProject(token: Bytes): Project {
  let project = Project.load(token);
  if (project == null) {
    project = new Project(token);
    project.token = token;
    project.owner = Bytes.empty();
    project.feeSplitter = Bytes.empty();
    project.tier = "Standard";
    project.active = false;
    project.registeredAt = BigInt.fromI32(0);
    project.totalDeposited = BigInt.fromI32(0);
    project.sunsetStatus = "Active";
    project.actualBalance = BigInt.fromI32(0);
  }
  return project;
}

function createEventId(txHash: Bytes, logIndex: BigInt): Bytes {
  return txHash.concatI32(logIndex.toI32());
}

function tierToString(tier: i32): string {
  if (tier == 0) return "Standard";
  if (tier == 1) return "Premium";
  return "Standard";
}

// ============ SunsetRegistry Handlers ============

export function handleProjectRegistered(event: ProjectRegistered): void {
  let token = event.params.token;
  let project = getOrCreateProject(token);

  project.owner = event.params.owner;
  project.feeSplitter = event.params.feeSplitter;
  project.tier = tierToString(event.params.tier);
  project.active = true;
  project.registeredAt = event.block.timestamp;
  project.sunsetStatus = "Active";
  project.save();

  // Update protocol stats
  let protocol = getOrCreateProtocol();
  protocol.totalProjects = protocol.totalProjects.plus(BigInt.fromI32(1));
  protocol.activeProjects = protocol.activeProjects.plus(BigInt.fromI32(1));
  protocol.save();
}

export function handleSunsetAnnounced(event: SunsetAnnounced): void {
  let token = event.params.token;
  let project = getOrCreateProject(token);

  project.sunsetStatus = "Announced";
  project.sunsetAnnouncedAt = event.block.timestamp;
  project.sunsetAnnouncedBy = event.params.announcedBy;
  project.executableAt = event.params.executableAt;
  project.reason = event.params.reason;
  project.save();

  // Create sunset event record
  let sunsetEvent = new SunsetEvent(createEventId(event.transaction.hash, event.logIndex));
  sunsetEvent.project = token;
  sunsetEvent.token = token;
  sunsetEvent.eventType = "Announced";
  sunsetEvent.actor = event.params.announcedBy;
  sunsetEvent.reason = event.params.reason;
  sunsetEvent.executableAt = event.params.executableAt;
  sunsetEvent.timestamp = event.block.timestamp;
  sunsetEvent.blockNumber = event.block.number;
  sunsetEvent.transactionHash = event.transaction.hash;
  sunsetEvent.save();
}

export function handleSunsetExecuted(event: SunsetExecuted): void {
  let token = event.params.token;
  let project = getOrCreateProject(token);

  project.sunsetStatus = "Executed";
  project.active = false;
  project.sunsetExecutedAt = event.block.timestamp;
  project.sunsetExecutedBy = event.params.executedBy;
  project.save();

  // Update protocol stats
  let protocol = getOrCreateProtocol();
  protocol.activeProjects = protocol.activeProjects.minus(BigInt.fromI32(1));
  protocol.sunsettedProjects = protocol.sunsettedProjects.plus(BigInt.fromI32(1));
  protocol.save();

  // Create sunset event record
  let sunsetEvent = new SunsetEvent(createEventId(event.transaction.hash, event.logIndex));
  sunsetEvent.project = token;
  sunsetEvent.token = token;
  sunsetEvent.eventType = "Executed";
  sunsetEvent.actor = event.params.executedBy;
  sunsetEvent.timestamp = event.block.timestamp;
  sunsetEvent.blockNumber = event.block.number;
  sunsetEvent.transactionHash = event.transaction.hash;
  sunsetEvent.save();
}

export function handleSunsetCancelled(event: SunsetCancelled): void {
  let token = event.params.token;
  let project = getOrCreateProject(token);

  project.sunsetStatus = "Active";
  project.sunsetAnnouncedAt = null;
  project.sunsetAnnouncedBy = null;
  project.executableAt = null;
  project.reason = null;
  project.save();

  // Create sunset event record
  let sunsetEvent = new SunsetEvent(createEventId(event.transaction.hash, event.logIndex));
  sunsetEvent.project = token;
  sunsetEvent.token = token;
  sunsetEvent.eventType = "Cancelled";
  sunsetEvent.actor = event.params.cancelledBy;
  sunsetEvent.timestamp = event.block.timestamp;
  sunsetEvent.blockNumber = event.block.number;
  sunsetEvent.transactionHash = event.transaction.hash;
  sunsetEvent.save();
}

export function handleFeeDeposited(event: FeeDeposited): void {
  let token = event.params.token;
  let project = getOrCreateProject(token);

  project.totalDeposited = project.totalDeposited.plus(event.params.amount);
  project.save();

  // Note: This is the registry's tracking. Vault's Deposited event has more details.
}

// ============ SunsetVault Handlers ============

export function handleDeposited(event: Deposited): void {
  let token = event.params.token;
  let project = getOrCreateProject(token);

  project.actualBalance = event.params.newBalance;
  project.save();

  // Create deposit record
  let deposit = new Deposit(createEventId(event.transaction.hash, event.logIndex));
  deposit.project = token;
  deposit.token = token;
  deposit.amount = event.params.amount;
  deposit.newBalance = event.params.newBalance;
  deposit.timestamp = event.block.timestamp;
  deposit.blockNumber = event.block.number;
  deposit.transactionHash = event.transaction.hash;
  deposit.save();

  // Update protocol stats
  let protocol = getOrCreateProtocol();
  protocol.totalDeposited = protocol.totalDeposited.plus(event.params.amount);
  protocol.save();
}

export function handleSunsetTriggered(event: SunsetTriggered): void {
  let token = event.params.token;
  let project = getOrCreateProject(token);

  project.snapshotSupply = event.params.snapshotSupply;
  project.snapshotBlock = event.block.number;
  project.actualBalance = event.params.actualBalance;
  project.save();

  // Create sunset event record
  let sunsetEvent = new SunsetEvent(createEventId(event.transaction.hash, event.logIndex));
  sunsetEvent.project = token;
  sunsetEvent.token = token;
  sunsetEvent.eventType = "Triggered";
  sunsetEvent.actor = event.transaction.from;
  sunsetEvent.actualBalance = event.params.actualBalance;
  sunsetEvent.snapshotSupply = event.params.snapshotSupply;
  sunsetEvent.timestamp = event.block.timestamp;
  sunsetEvent.blockNumber = event.block.number;
  sunsetEvent.transactionHash = event.transaction.hash;
  sunsetEvent.save();
}

export function handleClaimed(event: Claimed): void {
  let token = event.params.token;
  let project = getOrCreateProject(token);

  // Update project balance
  project.actualBalance = project.actualBalance!.minus(event.params.amount);
  project.save();

  // Create claim record
  let claim = new Claim(createEventId(event.transaction.hash, event.logIndex));
  claim.project = token;
  claim.token = token;
  claim.holder = event.params.holder;
  claim.amount = event.params.amount;
  claim.timestamp = event.block.timestamp;
  claim.blockNumber = event.block.number;
  claim.transactionHash = event.transaction.hash;
  claim.save();

  // Update protocol stats
  let protocol = getOrCreateProtocol();
  protocol.totalClaimed = protocol.totalClaimed.plus(event.params.amount);
  protocol.save();
}
