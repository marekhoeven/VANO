<template>
  <div class="receive">
    <div class="header">
      <div class="headerText no-hl container">
        <h1>Receive</h1>
      </div>
    </div>
    <div class="address">
      <div class="container">
        <div>Your address:</div>
        <span>{{address}}</span>
      </div>
    </div>

    <div class="receiveQR">
      <img :src="QRimg" alt>
    </div>

    <button class="copy" :class="{'green': clicked}" @click="copyAddress">{{copied}}</button>
  </div>
</template>

<script>
import * as QRCode from "qrcode";
import navigation from "../navigation.js";

export default {
  name: "Receive",
  data() {
    return {
      address: "",
      QRimg: "",
      copied: "Copy address",
      clicked: false
    };
  },
  async created() {
    this.$bus.onMessage.addListener(this.bgMessages);
    this.$bus.postMessage({ action: "update" });
  },

  methods: {
    async bgMessages(msg) {
      if (msg.action === "update") {
        this.address = msg.data.publicAccount;
        let qrdata = await QRCode.toDataURL(this.address);
        this.QRimg = qrdata;
      }
    },
    copyAddress() {
      this.$copyText(this.address);
      this.copied = "Copied!";
      this.clicked = true;
      setTimeout(() => {
        this.copied = "Copy address";
        this.clicked = false;
      }, 800);
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

.address {
  background-color: #fff;
  font-family: "RubikMedium", sans-serif;
  div div {
    padding-top: 20px;
    font-family: "RubikMedium", sans-serif;
    font-size: 12px;
    line-height: 16px;
    color: rgba(34, 36, 38, 0.3);
  }

  span {
    padding-top: 10px;
    padding-bottom: 20px;
    font-family: "RobotoMonoBold", sans-serif;
    font-size: 11px;
    line-height: 16px;
    color: #222426;
    display: block;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
}

.receiveQR {
  padding-top: 15px;
  display: flex;
  justify-content: center;
}

.receiveQR img {
  height: 90px;
  width: 90px;
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

  &:hover {
    background-color: #466eff;
  }
}

.green {
  background-color: #4bb993 !important;
  transition: background-color 0.01 ease;
}

h1 {
  padding-bottom: 20px;
  font-size: 17px;
}
</style>
