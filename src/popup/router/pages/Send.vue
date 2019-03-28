<template>
  <div class="send">
    <div class="header container">
      <div class="headerText no-hl">
        <h1>Send</h1>
        <p>It is hard to seperate from NANO</p>
      </div>
    </div>
    <div class="overview no-hl">
      <div class="sendingAmount">
        <div class="amount">
          <span>Amount:</span>
          <a class="max" @click="maxAmount">MAX</a>
          <input type="text" class="nanoAmount" v-model="amount" placeholder="0">
        </div>
      </div>
      <div class="toAddress">
        <span class="address">To address</span>
        <textarea
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          maxlength="65"
          type="text"
          placeholder="xrb_ or nano_"
          v-model="to_address"
        ></textarea>
      </div>

      <div class="errorMessage" v-if="errorMessage">{{errorMessage}}</div>
    </div>

    <button class="send no-hl" @click="trySend()" v-if="!generating">
      <span>Send NANO</span>
    </button>
    <button class="send no-hl" v-else>
      <span style="cursor: default">Generating work...</span>
    </button>
  </div>
</template>

<script>
import {
  getLocalStorageItem,
  setLocalStorageItem
} from "../../../utils/services.js";
import navigation from "../navigation.js";
export default {
  name: "send",
  data() {
    return {
      amount: "",
      to_address: "",
      errorMessage: false,
      generating: false,
      balance: 0
    };
  },
  watch: {
    amount() {
      setLocalStorageItem("amount", this.amount);
    },
    to_address() {
      setLocalStorageItem("to_address", this.to_address);
    }
  },

  async created() {
    this.$bus.onMessage.addListener(this.bgMessages);
    this.amount = (await getLocalStorageItem("amount")) || "";
    this.to_address = (await getLocalStorageItem("to_address")) || "";

    this.$bus.postMessage({ action: "update" });
  },

  beforeDestroy() {
    chrome.storage.local.remove(["amount", "to_address"], function() {});
  },

  methods: {
    bgMessages(msg) {
      if (msg.action === "errorMessage") {
        this.errorMessage = msg.data;
      }

      if (msg.action === "sendGenerate") {
        this.generating = true;
      }

      if (msg.action === "update") {
        this.balance = msg.data.full_balance;
      }
    },

    maxAmount() {
      if (this.balance > 0) {
        this.amount = this.balance.replace(",", ".");
      }
    },

    trySend() {
      this.errorMessage = false;

      if (this.amount.length == 0) {
        this.errorMessage = "Amount-field is empty";
        return;
      }

      if (this.to_address.length == 0) {
        this.errorMessage = "Address-field is empty";
        return;
      }

      this.$bus.postMessage({
        action: "send",
        data: { amount: this.amount, to: this.to_address.trim() }
      });
    }
  },
  mixins: [navigation]
};
</script>

<style lang="scss" scoped>
.wallet {
  background-color: #f7f7f7 !important;
  height: 100%;
}

.header {
  height: 123px;
}

.sendingAmount {
  background-color: #fff;
  .amount {
    display: flex;
    flex-direction: column;
    padding: 15px 25px 0 25px;

    span {
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 16px;
      color: rgba(34, 36, 38, 1);
      position: relative;
      top: 3px;
    }

    input {
      padding: 10px 0;
      border: none;
      background-color: #fff;
      font-family: "Roboto Mono", sans-serif;
      font-style: normal;
      font-weight: bold;
      font-size: 24px;
      line-height: 31px;
      width: 100%;

      &::placeholder {
        font-family: "Roboto Mono", sans-serif;
        color: rgba(34, 36, 38, 0.3);
      }
    }
  }
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

button {
  width: 100%;
  position: absolute;
  bottom: 0;
  height: 45px;
  border: none;
  font-style: normal;
  font-weight: 600;
  font-size: 15px;
  line-height: 21px;
  color: #ffffff;
  cursor: pointer;
  background-color: #2f55df;
  z-index: 1;
}

.toAddress {
  background-color: #fff;
  display: flex;
  flex-direction: column;
  padding: 13px 25px 10px 25px;
  border-top: 2px solid #f7f7f7;

  span {
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    color: rgba(34, 36, 38, 1);
    max-width: 100px;
  }

  textarea {
    border: none;
    font-family: "Roboto Mono", sans-serif;
    font-style: normal;
    font-weight: bold;
    font-size: 12px;
    line-height: 15px;
    color: rgba(34, 36, 38, 1);
    position: relative;
    top: 5px;
    width: 230px;
    height: 52px;
    white-space: pre-wrap;
    word-wrap: break-word;
    outline: none;
    resize: none;
    &::placeholder {
      color: rgba(34, 36, 38, 0.3);
    }
  }
}

input:focus::-webkit-input-placeholder,
textarea:focus::-webkit-input-placeholder {
  color: transparent !important;
}

.errorMessage {
  display: flex;
  justify-content: center;
  padding-top: 10px;
  font-weight: 500;
  color: #df4b54;
}

.max {
  font-weight: 500;
  position: absolute;
  right: 30px;
  margin-top: 7px;
  font-size: 11px;
  color: #2224263b;
}

.max:hover {
  color: rgba(34, 36, 38, 1);
  cursor: pointer;
}
</style>
