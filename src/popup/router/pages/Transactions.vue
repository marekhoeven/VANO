<template>
  <div class="transactions">
    <div class="header">
      <div class="headerText no-hl container">
        <h1>Transactions</h1>
      </div>
    </div>
    <div class="pendingProcess">
      <div class="pendingText container">
        <span :class="{ 'lowOpacity': !pendings}">{{pendingText}}</span>
        <button :class="{'hidden' : !pendings || isProcessing}" @click="processTransactions">Accept</button>
      </div>
    </div>
    <div class="linkHolder">
      <p v-if="noTX">No transactions</p>
      <div class="links no-hl" v-for="(item, index) in transactions" :key="index">
        <a
          class="link"
          :class="{'pending': item.type === 'pending'}"
          @click="getInfo(index, $event)"
          :ref="'link'+index"
        >
          <span class="link-items">
            <span class="info">
              <span class="amount">{{item.amount}}</span>
              <span class="address" :ref="'moreInfoShown'+index">{{item.account}}</span>
            </span>

            <span class="moreInfo" :ref="'moreInfo'+index">
              <span
                class="details"
                :ref="'details'+index"
                @click="goToExplorer(index, item.hash)"
              >View details</span>
              <span
                class="copy"
                :ref="'copy'+index"
                @click="copyAddress(index, item.source)"
              >Copy address</span>
            </span>
          </span>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import navigation from "../navigation.js";
import { setTimeout } from "timers";

export default {
  name: "Transactions",
  data() {
    return {
      transactions: [],
      isProcessing: false,
      pendings: 0,
      errorProcessing: false,
      clicked: false,
      noTX: true,
      offline: false
    };
  },

  computed: {
    pendingText() {
      if (this.errorProcessing) return this.errorProcessing;

      if (this.isProcessing) {
        if (this.pendings == 1) {
          return "Processing 1 deposit...";
        }
        return "Processing " + this.pendings.toString() + " deposits...";
      }

      if (this.pendings > 0 && !this.isProcessing) {
        if (this.pendings == 1) {
          return "1 pending deposit";
        }
        return this.pendings.toString() + " pending deposits";
      }

      if (this.pendings === 0 && !this.isProcessing) {
        return "No pending deposits";
      }
    }
  },

  beforeMount() {
    this.$bus.onMessage.addListener(this.bgMessages);
    this.$bus.postMessage({ action: "update" });
  },

  methods: {
    getInfo(id, el) {
      if (
        this.clicked === id.toString() &&
        el.target !== this.$refs["copy" + id][0]
      ) {
        this.clicked = false;
        this.$refs["link" + id][0].classList.remove("bigger");
        this.$refs["moreInfo" + id][0].classList.remove("showBlock");
        this.$refs["moreInfoShown" + id][0].classList.remove("moreInfoShown");
        return;
      }

      if (this.clicked !== false) {
        this.$refs["link" + this.clicked][0].classList.remove("bigger");
        this.$refs["moreInfo" + this.clicked][0].classList.remove("showBlock");
        this.$refs["moreInfoShown" + this.clicked][0].classList.remove(
          "moreInfoShown"
        );
      }

      this.clicked = id.toString();
      this.$refs["link" + id][0].classList.add("bigger");
      this.$refs["moreInfo" + id][0].classList.add("showBlock");
      this.$refs["moreInfoShown" + id][0].classList.add("moreInfoShown");
    },

    copyAddress(id, source) {
      this.$copyText(source);
      this.$refs["copy" + id][0].classList.add("green");
      setTimeout(() => {
        this.$refs["copy" + id][0].classList.remove("green");
      }, 300);
    },

    goToExplorer(id, hash) {
      let result = "https://nanocrawler.cc/explorer/block/" + hash;
      window.open(result, "_blank");
    },

    smallerAddress(address, type) {
      let prefix = address.slice(0, 3);
      let back = address.slice(-4);
      let front = "to: ";
      if (type === "receive" || type === "pending") front = "from: ";
      if (prefix === "xrb") front += address.slice(0, 8);
      if (prefix === "nan") front += address.slice(0, 9);

      return front + "..." + back;
    },

    adjustTransactions(overview) {
      let result = [];

      overview.forEach(element => {
        let pre_amount = "- ";
        if (element.type === "receive" || element.type === "pending") {
          pre_amount = "+ ";
        }
        let new_amount = pre_amount + element.amount;
        let item = {
          amount: new_amount.slice(0, 9),
          pending: element.pending,
          account: this.smallerAddress(element.account, element.type),
          source: element.account,
          hash: element.hash,
          type: element.type
        };

        result.push(item);
      });

      return result;
    },

    bgMessages(msg) {
      if (msg.action === "update") {
        this.offline = msg.data.offline;
        this.transactions = this.adjustTransactions(msg.data.transactions);
        this.pendings = msg.data.total_pending;
        this.isProcessing = msg.data.isProcessing;
        if (this.transactions.length > 0 || this.pendings > 0) {
          this.noTX = false;
        }

        if (this.clicked) {
          this.$refs["link" + this.clicked][0].classList.remove("bigger");
          this.$refs["moreInfo" + this.clicked][0].classList.remove(
            "showBlock"
          );
          this.$refs["moreInfoShown" + this.clicked][0].classList.remove(
            "moreInfoShown"
          );
          this.clicked = false;
        }
      }

      if (msg.action === "errorProcessing") {
        this.errorProcessing = msg.data;
      }
    },

    processTransactions() {
      if (this.offline) return;
      this.$bus.postMessage({ action: "processPending" });
    }
  },
  mixins: [navigation]
};
</script>

<style lang="scss" scoped>
.linkHolder p {
  color: rgba(34, 36, 38, 0.2);
  font-size: 16px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 90px;
}

.lowOpacity {
  opacity: 0.3;
  cursor: default;
}

h1 {
  padding-bottom: 20px;
  font-size: 17px;
}

.transactions {
  background-color: #f7f7f7 !important;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: "RubikMedium", sans-serif;
}
.pendingProcess {
  color: #fff;
  position: relative;
  width: 100%;
  height: 50px;
  background-color: #1f3ead;
  display: flex;
  align-items: center;
  font-family: "RubikMedium", sans-serif;
}

.linkHolder::-webkit-scrollbar {
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0);
  background-color: rgba(0, 0, 0, 0);
}

.linkHolder {
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 3px;
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    background-color: rgba(0, 0, 0, 0.3);
  }

  &::-webkit-scrollbar * {
    background: transparent;
  }

  flex: 1;
  overflow-y: auto;
  height: 200px;
}

.header {
  height: 100px;
}

.links {
  width: 100%;
  font-size: 12px;
  color: #222426;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  cursor: pointer;
  border-top: 2px solid #f7f7f7;
  font-family: "RubikMedium", sans-serif;
  .link:hover .link-items .info span:last-child {
    color: #222426;
  }

  .link {
    display: flex;
    flex: 0 0 100%;
    background-color: #fff;
    align-items: baseline;
    height: 43px;
    justify-content: center;
    transition: height 0.5s ease;

    .link-items .info {
      display: flex;
      margin-top: 16px;
      width: 230px;
      span:last-child {
        margin-left: auto;
        color: rgba(34, 36, 38, 0.3);
      }
    }

    .link-items .moreInfo {
      display: flex;
      visibility: hidden;
      margin-top: 8px;
      opacity: 0;
      transition: opacity 0.4s ease-in;
      span.details {
        &:hover {
          text-decoration: underline;
        }
      }

      span.copy {
        margin-left: auto;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .link-items .showBlock {
      visibility: visible;
      opacity: 1;
    }
  }
}

.links:first-child,
.pending:first-child {
  border-top: none !important;
}

.pending {
  background-color: #f3f3f3 !important;
  color: rgba(34, 36, 38, 0.3);
}

button {
  visibility: visible;
  width: auto;
  height: auto;
  border: none;
  border-radius: 2px;
  color: #fff;
  font-weight: bold;
  font-size: 12px;
  background-color: #162b79;
  padding: 6px 11px;
  cursor: pointer;
  transition: background-color 0.6s ease;
  margin-left: auto;
  &:hover {
    background-color: #193494;
  }
}

.hidden {
  visibility: hidden;
}

.dontShow {
  display: none !important;
}

.pendingText {
  display: flex;
  span {
    position: relative;
    top: 7px;
    font-family: "RubikMedium", sans-serif;
    font-size: 12px;
  }
}

.bigger {
  height: 65px !important;
  opacity: 1;
  background-color: #2f55df !important;
  color: #fff !important;

  .link-items .info {
    opacity: 0.4;
  }
}

.green {
  color: #54d3a7;
}

.moreInfoShown {
  color: #fff !important;
}
</style>
