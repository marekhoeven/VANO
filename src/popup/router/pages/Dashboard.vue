<template>
  <div class="wallet">
    <div class="header">
      <div class="headerText no-hl container">
        <h1>Dashboard</h1>
        <p>View your wallet details below</p>
      </div>
    </div>

    <div class="overview">
      <div class="balance">
        <span class="nanoBalance no-hl">NANO balance:</span>
        <span class="amount">{{balance}}</span>
      </div>
      <div class="links no-hl">
        <a class="link" @click="toPage('transactions')">
          <span>Transaction history</span>
          <span class="pending">({{total_pending}})</span>
          <svg width="7" height="10" viewBox="0 0 7 10" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 8.825L3.81667 5L0 1.175L1.175 0L6.175 5L1.175 10L0 8.825Z"></path>
          </svg>
        </a>
        <a
          class="link"
          :href="'https://nanocrawler.cc/explorer/account/' + address + '/history'"
          target="_blank"
        >
          <span>NANO explorer</span>
          <svg width="7" height="10" viewBox="0 0 7 10" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 8.825L3.81667 5L0 1.175L1.175 0L6.175 5L1.175 10L0 8.825Z"></path>
          </svg>
        </a>
      </div>
    </div>

    <div class="btns no-hl">
      <button class="send" @click="toPage('send')">Send</button>
      <button class="receive" @click="toPage('receive')">Receive</button>
    </div>
  </div>
</template>

<script>
import navigation from "../navigation.js";
export default {
  name: "dashboard",
  data() {
    return {
      balance: "0",
      total_pending: "0",
      address: ""
    };
  },
  methods: {
    bgMessages(msg) {
      if (msg.action === "update") {
        let data = msg.data;
        this.balance = data.balance;
        this.total_pending = data.total_pending;
        this.address = data.publicAccount;
      }
    }
  },
  beforeMount() {
    this.$bus.onMessage.addListener(this.bgMessages);
    this.$bus.postMessage({ action: "update" });
  },
  mixins: [navigation]
};
</script>

<style lang="scss" scoped>
.wallet {
  background-color: #f7f7f7 !important;
  height: 100%;
  font-family: "RubikMedium", sans-serif;
  display: flex;
  flex-direction: column;
}

.header {
  height: 123px;
}

.overview {
  width: 100%;
}

.balance,
.recent,
.explorer {
  background-color: #fff;
  border-bottom: 2px solid #f7f7f7;
  display: flex;
  align-items: center;
  font-style: normal;
  font-weight: 500;
  line-height: 16px;
  font-size: 12px;
  color: #222426;

  span:first-child {
    padding-left: 25px;
  }

  span:last-child,
  svg {
    margin-left: auto;
    padding-right: 25px;
  }
}

.balance {
  height: 55px;
}

.recent,
.explorer {
  height: 40px;
}

.links {
  width: 100%;
  font-style: normal;
  font-weight: 500;
  line-height: 16px;
  font-size: 12px;
  color: #222426;
  display: block;
  width: 100%;
  cursor: pointer;

  .link {
    display: block;
    display: flex;
    align-items: center;
    height: 43px;
    width: 100%;
    background-color: #fff;
    fill-opacity: 0.2;
    span {
      padding-left: 25px;
    }

    svg {
      margin-left: auto;
      padding-right: 25px;
    }
  }

  .link:last-child {
    margin-top: 2px;
  }
}

.link:hover {
  path {
    fill-opacity: 1;
  }
}

.nanoBalance {
  font-style: normal;
  font-weight: 500;
  font-size: 13px;
  line-height: 17px;
  color: rgba(34, 36, 38, 0.3);
}

.amount {
  font-family: "RobotoMonoBold", sans-serif;
  font-size: 24px;
  line-height: 31px;
  color: #222426;
}

.link span.pending {
  padding-left: 5px;
  font-family: "RobotoMonoMedium", sans-serif;
  font-size: 13px;
  line-height: 17px;
  color: rgba(34, 36, 38, 0.3);
}

.btns {
  width: 100%;
  display: flex;
  flex-grow: 1;

  button:first-child {
    background-color: #2f55df;
    &:hover {
      background-color: #1c3693;
    }
  }

  button:last-child {
    background-color: #1e3fba;
    &:hover {
      background-color: #1c3693;
    }
  }

  button {
    height: 50px;
    font-size: 15px;
    font-family: "RubikMedium";
    margin-top: auto;
    width: 50%;
    border: none;
    border-radius: 0px;
    color: #ffffff;
    cursor: pointer;
  }
}
</style>
