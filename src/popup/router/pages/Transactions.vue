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
        <button
          :class="{'hidden' : pendings, 'hidden' : !isProcessing}"
          @click="processTransactions"
        >Accept</button>
      </div>
    </div>
    <div class="linkHolder">
      <div class="links no-hl" v-for="(item, index) in transactions" :key="index">
        <a class="link" :class="{ 'pending': item.pending }" @click="toHash(item.hash)">
          <span class="link-items">
            <span class="amount">{{item.amount}}</span>
            <span class="address">{{item.account}}</span>
          </span>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import navigation from "../navigation.js";

export default {
  name: "Transactions",
  data() {
    return {
      transactions: [],
      isProcessing: false,
      pendings: 0,
      errorProcessing: false
    };
  },

  computed: {
    pendingText() {
      if (this.errorProcessing) return this.errorProcessing;

      if (this.pendings > 0 && !this.isProcessing) {
        return this.pendings.toString() + " pending deposits";
      }

      if (this.isProcessing) {
        return "Processing " + this.pendings.toString() + " deposits...";
      }

      if (this.pendings === 0 && !this.isProcessing) {
        return "No pending deposits";
      }
    }
  },

  beforeMount() {
    this.$bus.onMessage.addListener(this.bgMessages);
    this.$bus.postMessage({ action: "update" });
    this.$bus.postMessage({ action: "isProcessing" });
  },

  methods: {
    smallerAddress(address, type) {
      let prefix = address.slice(0, 3);
      let back = address.slice(-4);
      let front = "to: ";
      if (type === "receive") front = "from: ";
      if (prefix === "xrb") front += address.slice(0, 8);
      if (prefix === "nan") front += address.slice(0, 9);

      return front + "..." + back;
    },

    adjustTransactions(overview) {
      let result = [];

      overview.forEach(element => {
        let pre_amount = "- ";
        if (element.type === "receive") {
          pre_amount = "+ ";
        }
        let new_amount = pre_amount + element.amount;
        let item = {
          amount: new_amount.slice(0, 9),
          pending: element.pending,
          account: this.smallerAddress(element.account, element.type),
          hash: element.hash
        };

        result.push(item);
      });

      return result;
    },

    bgMessages(msg) {
      if (msg.action === "update") {
        this.transactions = this.adjustTransactions(msg.data.transactions);
        this.pendings = msg.data.total_pending;
      }

      if (msg.action === "isProcessing") {
        this.isProcessing = msg.data;
      }

      if (msg.action === "errorProcessing") {
        this.errorProcessing = msg.data;
      }
    },

    processTransactions() {
      console.log("starting processing pending");
      this.$bus.postMessage({
        action: "processPending"
      });
    }
  },
  mixins: [navigation]
};
</script>

<style lang="scss" scoped>
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
    width: 5px;
    background-color: #f5f5f5;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 50px;
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    background-color: rgba(0, 0, 0, 0.6);
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
  width: 100%;
  cursor: pointer;
  border-top: 2px solid #f7f7f7;
  font-family: "RubikMedium", sans-serif;
  .link:hover .link-items span:last-child {
    color: #222426;
  }
  .link {
    display: flex;
    flex: 0 0 100%;
    background-color: #fff;
    align-items: center;
    height: 43px;
    fill-opacity: 0.2;
    justify-content: center;

    .link-items {
      display: flex;
      width: 230px;
      span:last-child {
        margin-left: auto;
        color: rgba(34, 36, 38, 0.3);
      }
    }
  }

  .link:hover {
    path {
      fill-opacity: 1;
    }
  }

  .pending {
    color: rgba(34, 36, 38, 0.3);
  }
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

.pendingText {
  display: flex;

  span {
    position: relative;
    top: 7px;
  }
}
</style>
