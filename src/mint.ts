import { hash256 } from "scryptlib";

import type { Wallet } from "./wallet";
import { MAX_LOCKTIME } from "./constants";
import powJson from "./contracts/n20-pow.json";
import { offlineVerify } from "./note-verify";
import { stringToBytes } from "./utils";
import jestConfig from "../jest.config";

const bitwork = "20";

const tick = "NOTE";

const deployData = {
  p: "n20",
  op: "deploy",
  tick,
  max: 2100n * 10000n * 10n ** 8n,
  lim: 5000n * 10n ** 8n,
  dec: 8,
  start: 830400, //start from height
  bitwork: stringToBytes(bitwork),
  sch: "50b13619d4d936d7c5c7fb7dfbe752e33b85b33774e9e2b3779f16791fb1c749",
};
const mintData = {
  p: "n20",
  op: "mint",
  tick,
  amt: 15600000000n,
};

export async function deployPowToken(wallet: Wallet) {
  return wallet.mint(wallet.buildN20Payload(deployData));
}

export async function mintPowToken(wallet: Wallet) {
  let toAddress, noteNote, payNotes, feeRate;
  // random locktime
  let locktime = Math.floor(Math.random() * MAX_LOCKTIME);
  let checkcount = 0;
  let result;
  const bestBlock = await wallet.bestBlock();
  console.log("🚀 ~ mintPowToken ~ bestBlock:", bestBlock);
  if(bestBlock.height<deployData.start){
    return {success:false,error:"waiting for start height"}
  }
  await wallet.getBalance()

  const dataMap: any = {
    constructor: {
      ...deployData,
      op: stringToBytes(deployData.op),
      tick: stringToBytes(deployData.tick),
      p: stringToBytes(deployData.p),
    },
    mint: {
      ...deployData,
      ...mintData,
      tick: stringToBytes(mintData.tick),
      op: stringToBytes(mintData.op),
      p: stringToBytes(mintData.p),
      height: bestBlock.height,
      total: 0n,
    },
    transfer: {
      tick: stringToBytes(tick),
    },
  };

  const payload = wallet.buildN20Payload(mintData);
  while (locktime < MAX_LOCKTIME) {
    if (++checkcount % 1000 === 0) {
      console.log("🚀 ~ mintPowToken ~ check:", checkcount);
      // reset params
      toAddress = undefined;
      noteNote = undefined;
      payNotes = undefined;
      feeRate = undefined;
    }
    payload.locktime = locktime; //to change tx
    const tx = await wallet.buildN20Transaction(
      payload,
      toAddress,
      noteNote,
      payNotes,
      feeRate,
    );
    const txHash256 = hash256(tx.txHex);
    //console.log("checking", txHash256, locktime);
    if (txHash256.startsWith(deployData.bitwork)) {
      dataMap.mint.tx = tx.txHex;
      const verifyResult = offlineVerify(powJson, dataMap, "mint");
      console.log("🚀 ~ mintPowToken ~ verifyResult:", verifyResult, tx," index ");
      if (verifyResult.success) {
        result = await wallet.broadcastTransaction(tx);
        locktime = 0;
        toAddress = undefined;
        noteNote = undefined;
        payNotes = undefined;
        feeRate = undefined;
        return result;
      }
      break;
    } else {
      toAddress = tx.toAddress;
      noteNote = tx.noteUtxo;
      payNotes = tx.payUtxos;
      feeRate = tx.feeRate;
      locktime++;
    }
  }
  return {
    success: false,
    error: "Failed to mint NotePow token",
  };
}
