<template>
  <div class="receive">
    <div class="header container">
      <div class="headerText no-hl">
        <h1>Receive</h1>
        <p>Having more NANO is a happier life</p>
      </div>
    </div>
    <div class="address container">
      <div>Your address:</div>
      <span>{{address}}</span>
    </div>

    <div class="receiveQR">
      <img :src="QRimg" alt>
    </div>

    <button class="copy" @click="copyAddress">{{copied}}</button>
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
    this.$bus.postMessage({
      action: "publicAccount"
    });
  },

  methods: {
    async bgMessages(msg) {
      if (msg.action === "publicAccount") {
        this.address = msg.data;
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
      }, 1000);
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
  div {
    padding-top: 20px;
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    color: rgba(34, 36, 38, 0.3);
  }

  span {
    padding-top: 10px;
    padding-bottom: 20px;
    font-family: "Roboto Mono", sans-serif;
    font-style: normal;
    font-weight: bold;
    font-size: 11px;
    line-height: 14px;
    color: #222426;
    display: block;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
}

.receiveQR {
  padding-top: 17px;
  display: flex;
  justify-content: center;
}

.receiveQR img {
  height: 90px;
  width: 90px;
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
}
</style>
