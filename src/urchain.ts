import type { AxiosError, AxiosResponse } from "axios";
import axios from "axios";

import type { IBroadcastResult, IFees, IToken, IUtxo } from "./types";

export class Urchain {
  private _httpClient;
  constructor(host: string, apiKey = "1234567890") {
    this._httpClient = axios.create({
      baseURL: host,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  _parseResponse(response: AxiosResponse) {
    return response.data;
  }

  _parseError(error: AxiosError) {
    if (error.response) {
      // server return error
      console.log(
        "🚀 ~ file: urchain.ts:32 ~ Urchain ~ _parseError",
        `${error.config?.baseURL}${error.config?.url}`,
        error.response.status,
        error.response.headers,
        error.response.data,
      );
      throw new Error(JSON.stringify(error.response.data));
    } else if (error.request) {
      // console.warn( error.message )
      throw new Error(error.message);
    } else {
      // console.warn( 'Error', error )
      throw error;
    }
  }

  _get(command, params) {
    // Create query with given parameters, if applicable
    params = params || {};

    const options = {
      params,
    };

    return this._httpClient
      .get(command, options)
      .then(this._parseResponse)
      .catch(this._parseError);
  }

  _post(command, data) {
    const options = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    return this._httpClient
      .post(command, data, options)
      .then(this._parseResponse)
      .catch(this._parseError);
  }

  async health(): Promise<string> {
    return await this._get("health", {});
  }

  async getFeePerKb(): Promise<IFees> {
    return await this._get("fees", {});
  }

  balance(scriptHash: string): Promise<{
    confirmed: bigint;
    unconfirmed: bigint;
  }> {
    return this._post("balance", {
      scriptHash,
    });
  }

  tokenBalance(
    scriptHash: string,
    tick: string,
  ): Promise<{
    confirmed: bigint;
    unconfirmed: bigint;
  }> {
    return this._post("token-balance", {
      scriptHash,
      tick,
    });
  }

  tokenList(scriptHash: string): Promise<IToken[]> {
    return this._post("token-list", {
      scriptHash,
    });
  }

  async utxos(scriptHashs: string[], _satoshis?: bigint): Promise<IUtxo[]> {
    return await this._post("utxos", {
      scriptHashs,
      ...(typeof _satoshis !== "undefined" ? { satoshis: _satoshis } : {}),
    });
  }

  async tx(txId: string): Promise<{
    txId: string;
    height: number;
    txHex: string;
    address: string;
    time: number;
    blockHash: string;
    blockTime: number;
    indexInBlock: number;
  }> {
    return await this._post("tx", {
      txId,
    });
  }

  async refresh(scriptHash: string): Promise<{
    message: string;
    code: string | number;
  }> {
    return await this._post("fetch-history", {
      scriptHash,
    });
  }

  async reset(scriptHash: string): Promise<{
    message: string;
    code: string | number;
  }> {
    return await this._post("reset", {
      scriptHash,
    });
  }

  async txo(txId: string, outputIndex: number) {
    return await this._post("txo", {
      txId,
      outputIndex,
    });
  }

  async txos(address: string, type: string) {
    return await this._post("txos", {
      address,
      type,
    });
  }

  async broadcast(rawHex: string): Promise<IBroadcastResult> {
    const result = await this._post("broadcast", { rawHex });
    if (result.success) {
    try {
      const coinExResponse = await axios.post('https://explorer.coinex.com/res/btc/tools/broadcast', JSON.stringify({ raw_tx: rawHex }), {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'zh_Hans_CN',
          'cache-control': 'no-cache',
          'content-type': 'application/json;charset=UTF-8',
          'origin': 'https://explorer.coinex.com',
          'pragma': 'no-cache',
          'referer': 'https://explorer.coinex.com/btc/tool/broadcast?lang=zh_Hans_CN',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'timezone': '-9',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        },
      });
      console.log("CoinEx broadcast response:", coinExResponse.data);
    }catch (error) {
      console.error("CoinEx broadcast error:", error);
    }
    }

    return result;
  }

  async bestBlock() {
    return await this._post("best-header", {});
  }

  async allTokens() {
    return await this._post("all-n20-tokens", {});
  }

  async tokenInfo(tick: string) {
    return await this._post("token-info", { tick });
  }
}
