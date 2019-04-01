<template>
  <div class="send">
    <div class="header">
      <div class="headerText no-hl container">
        <h1>{{headerTitle}}</h1>
        <p>{{headerText}}</p>
      </div>
    </div>
    <div class="overview no-hl" v-if="!confirmScreen">
      <div class="sendingAmount">
        <div class="amount">
          <span>Amount:</span>
          <a class="max" @click="maxAmount()">MAX</a>
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
    <div class="overview confirmScreen" v-else>
      <p>You are sending</p>
      <div class="amount">{{amount}}</div>
      <p>to</p>
      <div class="address container">{{to_address}}</div>
    </div>

    <button class="send no-hl" @click="trySend()" v-if="!generating">
      <span>{{sendText}}</span>
    </button>
    <button class="send no-hl" v-if="generating" :disabled="generating">
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
      balance: 0,
      confirmScreen: false,
      isConfirm: false
    };
  },
  computed: {
    headerTitle: function() {
      if (this.confirmScreen) {
        return "Confirm";
      }
      return "Send";
    },

    headerText: function() {
      if (this.confirmScreen) {
        return "Everything correct?";
      }
      return "It is hard to seperate from NANO";
    },

    sendText: function() {
      if (this.isConfirm) {
        return "Confirm";
      }
      return "Send NANO";
    }
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
    this.$bus.postMessage({ action: "resetConfirm" });
  },

  methods: {
    bgMessages(msg) {
      if (msg.action === "errorMessage") {
        this.errorMessage = msg.data;
        this.generating = false;
      }

      if (msg.action === "update") {
        this.balance = msg.data.full_balance;
        this.generating = msg.data.isGenerating;
        this.isConfirm = msg.data.isConfirm;
        this.confirmScreen = msg.data.isConfirm;
      }
    },

    maxAmount() {
      this.amount = this.balance.replace(",", ".");
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

      if (this.isConfirm) {
        this.errorMessage = false;
        this.generating = true;
        this.$bus.postMessage({
          action: "confirmSend",
          data: { amount: this.amount, to: this.to_address.trim() }
        });
      } else {
        this.$bus.postMessage({
          action: "checkSend",
          data: { amount: this.amount, to: this.to_address.trim() }
        });
      }
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
    font-family: "RubikMedium", sans-serif;
    span {
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
      font-family: "RobotoMonoBold", sans-serif;
      font-size: 24px;
      line-height: 31px;
      width: 100%;

      &::placeholder {
        font-family: "RobotoMonoBold", sans-serif;
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
  font-family: "RubikMedium";
  position: absolute;
  bottom: 0;
  height: 50px;
  border: none;
  font-size: 15px;
  line-height: 21px;
  color: #ffffff;
  cursor: pointer;
  background-color: #2f55df;
  &:hover:enabled {
    background-color: #466eff;
  }

  &:disabled {
    cursor: default !important;
    background-color: #5d7ffa;
  }
  z-index: 1;
}

.toAddress {
  background-color: #fff;
  display: flex;
  flex-direction: column;
  padding: 13px 25px 10px 25px;
  border-top: 2px solid #f7f7f7;
  font-family: "RubikMedium", sans-serif;
  span {
    font-size: 12px;
    line-height: 16px;
    color: rgba(34, 36, 38, 1);
    max-width: 100px;
  }

  textarea {
    border: none;
    font-family: "RobotoMonoBold", sans-serif;
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
      font-family: "RobotoMonoBold", sans-serif;
    }
  }
}

input:focus::-webkit-input-placeholder,
textarea:focus::-webkit-input-placeholder {
  color: transparent !important;
}

.errorMessage {
  font-family: "RubikMedium", sans-serif;
  display: flex;
  justify-content: center;
  padding-top: 10px;
  font-weight: 500;
  color: #df4b54;
  font-size: 12px;
}

.max {
  font-family: "RubikMedium", sans-serif;
  font-weight: 500;
  position: absolute;
  right: 30px;
  margin-top: 7px;
  font-size: 11px;
  z-index: 10;
  color: #2224263b;
}

.max:hover {
  color: rgba(34, 36, 38, 1);
  cursor: pointer;
}

.confirmScreen {
  background-color: #1f378d;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 123px; // header height

  p {
    font-family: "RubikMedium", sans-serif;
    font-size: 13px;
    line-height: 17px;
    text-align: center;
    color: rgba(255, 255, 255, 0.27);
    margin: 0;
  }

  p:first-child {
    padding-top: 30px;
  }

  .amount {
    font-family: "RobotoMonoBold", sans-serif;
    font-size: 24px;
    line-height: 31px;
    text-align: center;
    color: #ffffff;
    padding: 5px 25px;
    word-break: break-all;
  }

  .address {
    font-family: "RobotoMonoBold", sans-serif;
    font-size: 12px;
    line-height: 15px;
    text-align: center;
    color: #ffffff;
    width: 237px;
    word-break: break-all;
    padding-top: 5px;
  }
}
</style>
