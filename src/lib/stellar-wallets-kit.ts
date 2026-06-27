export enum WalletNetwork {
  PUBLIC = "PUBLIC",
  TESTNET = "TESTNET",
}

export class FreighterConnector {
  id = "freighter";
  name = "Freighter";
}

export class AlbedoConnector {
  id = "albedo";
  name = "Albedo";
}

export class LobstrConnector {
  id = "lobstr";
  name = "Lobstr";
}

export class XBullConnector {
  id = "xbull";
  name = "xBull";
}

export interface KitOptions {
  network: WalletNetwork;
  selectedWallet?: string;
  modules?: any[];
}

export class StellarWalletsKit {
  private network: WalletNetwork;
  private selectedWallet: string | null = null;

  constructor(options: KitOptions) {
    this.network = options.network;
    if (options.selectedWallet) {
      this.selectedWallet = options.selectedWallet;
    } else {
      this.selectedWallet = localStorage.getItem("stellar_wallet_id");
    }
  }

  setWallet(walletId: string | null) {
    this.selectedWallet = walletId;
    if (walletId) {
      localStorage.setItem("stellar_wallet_id", walletId);
    } else {
      localStorage.removeItem("stellar_wallet_id");
    }
  }

  getWallet() {
    return this.selectedWallet;
  }

  async open(options: { onWalletSelected: (wallet: { id: string }) => void }) {
    // Fire a custom window event that the React UI listens to
    // This displays a beautiful, custom React wallet selector modal
    const event = new CustomEvent("stellar-wallet-modal-open", {
      detail: {
        onSelect: (walletId: string) => {
          this.setWallet(walletId);
          options.onWalletSelected({ id: walletId });
        },
      },
    });
    window.dispatchEvent(event);
  }

  async getPublicKey(): Promise<string> {
    const wallet = this.getWallet();
    if (!wallet) {
      throw new Error("No wallet connected. Please connect your wallet.");
    }

    if (wallet === "freighter") {
      const keystore = (window as any).stellarKeystore;
      if (!keystore) {
        throw new Error("Freighter extension was not found. Please install the Freighter browser extension.");
      }
      try {
        const pk = await keystore.getPublicKey();
        return pk;
      } catch (err: any) {
        if (err?.message && err.message.includes("User rejected")) {
          throw new Error("User rejected Freighter public key access request.");
        }
        throw new Error(err?.message || "Failed to retrieve public key from Freighter.");
      }
    }

    if (wallet === "albedo") {
      const albedo = (window as any).albedo;
      if (!albedo) {
        throw new Error("Albedo service or browser extension was not found.");
      }
      try {
        const res = await albedo.publicKey();
        return res.pubkey;
      } catch (err: any) {
        throw new Error("Albedo public key request was rejected by the user.");
      }
    }

    if (wallet === "lobstr") {
      const lobstr = (window as any).lobstr;
      if (!lobstr) {
        throw new Error("Lobstr browser extension was not found.");
      }
      try {
        const pk = await lobstr.getPublicKey();
        return pk;
      } catch (err: any) {
        throw new Error("Lobstr public key request was rejected.");
      }
    }

    if (wallet === "xbull") {
      const xbull = (window as any).xbull;
      if (!xbull) {
        throw new Error("xBull browser extension was not found.");
      }
      try {
        const pk = await xbull.getPublicKey();
        return pk;
      } catch (err: any) {
        throw new Error("xBull public key request was rejected.");
      }
    }

    if (wallet === "simulated") {
      // Return the persistent simulated public key
      let pk = localStorage.getItem("simulated_stellar_address");
      if (!pk) {
        // Generate a new realistic public key
        pk = "GD" + Array.from({ length: 54 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[Math.floor(Math.random() * 32)]).join("");
        localStorage.setItem("simulated_stellar_address", pk);
      }
      return pk;
    }

    throw new Error(`Unsupported wallet connector: ${wallet}`);
  }

  async signTransaction(xdr: string, opts?: { network?: string }): Promise<string> {
    const wallet = this.getWallet();
    if (!wallet) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }

    if (wallet === "freighter") {
      const keystore = (window as any).stellarKeystore;
      if (!keystore) {
        throw new Error("Freighter extension not found.");
      }
      try {
        const signed = await keystore.signTransaction({
          xdr,
          network: opts?.network || this.network,
        });
        return signed;
      } catch (err: any) {
        throw new Error("User rejected transaction signature request in Freighter.");
      }
    }

    if (wallet === "albedo") {
      const albedo = (window as any).albedo;
      if (!albedo) {
        throw new Error("Albedo extension not found.");
      }
      try {
        const res = await albedo.tx({ xdr, network: opts?.network || this.network });
        return res.signed_envelope;
      } catch (err: any) {
        throw new Error("User rejected transaction signature request in Albedo.");
      }
    }

    if (wallet === "simulated") {
      // Simulating signing by returning the XDR envelope as-is
      console.log("Simulating signature for simulated account on XDR:", xdr);
      return xdr;
    }

    throw new Error(`Signature not supported yet for ${wallet} connector.`);
  }
}
