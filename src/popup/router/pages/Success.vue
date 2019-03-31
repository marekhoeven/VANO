<template>
  <div class="success">
    <svg
      class="check"
      width="46"
      height="46"
      viewBox="0 0 46 46"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M23 0.628723C10.6435 0.628723 0.628906 10.6433 0.628906 22.9998C0.628906 35.3564 10.6435 45.3709 23 45.3709C35.3565 45.3709 45.3711 35.3563 45.3711 22.9998C45.3711 10.6432 35.3565 0.628723 23 0.628723ZM23 43.5812C11.6519 43.5812 2.41859 34.3479 2.41859 22.9997C2.41859 11.6516 11.6519 2.41832 23 2.41832C34.3482 2.41832 43.5814 11.6517 43.5814 22.9997C43.5814 34.3479 34.3482 43.5812 23 43.5812Z"
        fill="white"
      ></path>
      <path
        d="M34.5211 14.2125L19.4888 29.2457L11.4876 21.2463L10.217 22.517L19.4888 31.7869L35.783 15.4831L34.5211 14.2125Z"
        fill="white"
      ></path>
    </svg>

    <h1>Success</h1>
    <p>Your transaction was successful</p>
    <div class="info">
      <div class="hashLabel">Hash:</div>
      <div class="hash container" @click="goToTab()">{{hash}}</div>
    </div>

    <a class="goBack" @click="toPage('dashboard')">Go back to the dashboard</a>
  </div>
</template>

<script>
import navigation from "../navigation.js";
export default {
  name: "Success",
  data() {
    return {
      hash: ""
    };
  },
  beforeMount() {
    this.$bus.onMessage.addListener(this.bgMessages);
    this.$bus.postMessage({ action: "update" });
  },
  methods: {
    goToTab() {
      let result = "https://nanocrawler.cc/explorer/block/" + this.hash;
      window.open(result, "_blank");
    },

    bgMessages(msg) {
      if (msg.action === "update") {
        this.hash = msg.data.sendHash;
      }
    }
  },
  mixins: [navigation]
};
</script>

<style lang="scss" scoped>
.success {
  width: 100%;
  height: 100%;
  background-color: #2f55df;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.check {
  padding: 50px 0 20px 0;
}

h1 {
  padding-bottom: 10px;
}

p {
  font-style: normal;
  font-weight: normal;
  font-size: 12px;
  line-height: 16px;
}

.info {
  display: block;
  padding: 0;
  margin: 0 auto;
  padding: 5px 0;
  font-family: "RobotoMonoMedium", sans-serif;
  font-style: normal;
  font-weight: bold;
  font-size: 12px;
  line-height: 15px;
  color: rgba(255, 255, 255, 0.3);
}

.hashLabel {
  width: 230px;
  text-align: center;
}

.hash {
  white-space: pre-wrap;
  word-wrap: break-word;
  width: 120px;
  cursor: pointer;
  text-align: justify;
  text-decoration: underline;
}

.goBack {
  position: relative;
  top: 20px;
  font-size: 12px;
  line-height: 16px;
  color: #ffffff;
  cursor: pointer;
  text-decoration: underline;
  font-family: "RubikMedium", sans-serif;
}
</style>
