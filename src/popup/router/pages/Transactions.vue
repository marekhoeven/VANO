<template>
  <div class="transactions">
    <div class="header container">
      <div class="headerText no-hl">
        <h1>Transactions history</h1>
        <p>Processing any pending blocks</p>
      </div>
    </div>
    <div class="links no-hl" v-for="(item, index) in transactions" :key="index">
      <a class="link container" :class="{ 'pending': item.pending }" @click="toHash(item.hash)">
        <span class="amount">{{item.amount}}</span>
        <span class="address">{{item.account}}</span>
      </a>
    </div>

    <button class="checkAll" @click="toExplorer()">Check all transactions</button>
  </div>
</template>

<script>
import navigation from "../navigation.js";

export default {
  name: "Transactions",
  data() {
    return {
      transactions: [],
      address: ""
    };
  },
  created() {
    this.$bus.onMessage.addListener(this.bgMessages);
    this.$bus.postMessage({
      action: "update"
    });

    this.$bus.postMessage({
      action: "publicAccount"
    });

    this.$bus.postMessage({
      action: "processPending"
    });
  },

  methods: {
    toHash(hash) {
      let result = "https://nanocrawler.cc/explorer/block/" + hash;
      window.open(result, "_blank");
    },

    smallerAddress(address, type) {
      let prefix = address.slice(0, 3);
      let back = address.slice(-3);
      let front = "to: ";
      if (type === "receive") front = "from: ";
      if (prefix === "xrb") front += address.slice(0, 7);
      if (prefix === "nan") front += address.slice(0, 8);

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

    toExplorer() {
      let result =
        "https://nanocrawler.cc/explorer/account/" + this.address + "/history";
      window.open(result, "_blank");
    },

    bgMessages(msg) {
      if (msg.action === "update") {
        this.transactions = this.adjustTransactions(msg.data.transactions);
      }

      if (msg.action === "publicAccount") {
        this.address = msg.data;
      }
    }
  },
  mixins: [navigation]
};
</script>

<style lang="scss" scoped>
.transactions {
  background-color: #f7f7f7 !important;
  height: 100%;
}

.header {
  height: 123px;
}

.links {
  width: 280px;
  font-style: normal;
  font-weight: 500;
  line-height: 16px;
  font-size: 12px;
  color: #222426;
  display: block;
  width: 100%;
  font-family: "Roboto Mono", sans-serif;
  font-style: normal;
  font-weight: bold;
  font-size: 12px;
  line-height: 15px;

  .link {
    display: flex;
    cursor: pointer;
    align-items: center;
    height: 43px;
    width: 280px;
    background-color: #fff;
    fill-opacity: 0.2;
    border-top: 2px solid #f7f7f7;
    box-sizing: border-box;
    span:last-child {
      margin-left: auto;
      text-align: right;
      color: rgba(34, 36, 38, 0.3);
    }

    &:hover {
      span:last-child {
        color: rgba(34, 36, 38, 1);
      }
    }
  }

  .pending {
    color: rgba(34, 36, 38, 0.3);
  }
}

button {
  border: none;
  border-radius: 2px;
  color: #fff;
  font-style: normal;
  font-weight: 600;
  line-height: 18px;
  font-size: 14px;
  background-color: #2f55df;
  width: 230px;
  height: 40px;
  background: #2f55df;
  border-radius: 2px;
  margin: 0 auto;
  display: block;
  position: relative;
  top: 20px;
  outline: none;
  cursor: pointer;
}
</style>
