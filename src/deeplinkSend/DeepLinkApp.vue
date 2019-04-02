<template>
  <div class="app">
    <!-- SENDFORM OF TX PAGE -->
    <div class="sendField" v-if="sendPage">
      <div class="header container">
        <h1>Send</h1>
        <p>You’ve clicked to pay with NANO</p>
      </div>

      <div class="overview">
        <div class="amountField container">
          <h5>Amount:</h5>
          <div class="amount">{{amount}}</div>
        </div>
        <div class="divider"></div>
        <div class="toField container">
          <h5>To address:</h5>
          <div class="to">{{to}}</div>
        </div>
      </div>
      <div class="error" :class="{errorMessage}">{{errorMessage}}</div>
      <div class="buttons">
        <button class="send" @click="toConfirm()">Accept</button>
        <button class="reject" @click="close()">Reject</button>
      </div>
    </div>

    <div class="confirmField" v-if="!sendPage && confirmScreen">
      <div class="header container">
        <h1>Confirm</h1>
        <p>Are you sure?</p>
      </div>
      <div class="overview">
        <p>You are sending</p>
        <div class="amount">{{amount}}</div>
        <p>to</p>
        <div class="address">{{to}}</div>
      </div>
      <div class="error" :class="{errorMessage}">{{errorMessage}}</div>
      <div class="buttons" v-if="!generating">
        <button class="confirm" @click="trySend()">Confirm transaction</button>
      </div>
      <div class="generating" v-if="generating">
        <svg
          version="1.1"
          id="loader-1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          x="0px"
          y="0px"
          width="40px"
          height="40px"
          viewBox="0 0 50 50"
          style="enable-background:new 0 0 50 50;"
          xml:space="preserve"
        >
          <path
            fill="#fff"
            d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"
          >
            <animateTransform
              attributeType="xml"
              attributeName="transform"
              type="rotate"
              from="0 25 25"
              to="360 25 25"
              dur="0.6s"
              repeatCount="indefinite"
            ></animateTransform>
          </path>
        </svg>
      </div>
    </div>

    <!-- RESULT OF TX PAGE -->
    <div class="responseField" v-if="(!sendPage && !errorHash && !confirmScreen)">
      <svg
        width="46"
        height="46"
        viewBox="0 0 46 46"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M23 0.628784C10.6435 0.628784 0.628906 10.6434 0.628906 22.9999C0.628906 35.3564 10.6435 45.371 23 45.371C35.3565 45.371 45.3711 35.3564 45.3711 22.9999C45.3711 10.6433 35.3565 0.628784 23 0.628784ZM23 43.5813C11.6519 43.5813 2.41859 34.3479 2.41859 22.9998C2.41859 11.6516 11.6519 2.41838 23 2.41838C34.3482 2.41838 43.5814 11.6517 43.5814 22.9998C43.5814 34.3479 34.3482 43.5813 23 43.5813Z"
          fill="white"
        ></path>
        <path
          d="M34.5211 14.2125L19.4888 29.2457L11.4876 21.2463L10.217 22.517L19.4888 31.7869L35.783 15.4831L34.5211 14.2125Z"
          fill="white"
        ></path>
      </svg>
      <p>Your transaction was successfull</p>
      <h5>Hash</h5>
      <div class="hash" @click="toHash()">{{hash}}</div>
      <button class="close" @click="close()">Close</button>
    </div>

    <div class="responseField" v-if="errorHash">
      <svg
        width="25px"
        height="25px"
        viewBox="0 0 46 46"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M23 0.628906C10.6435 0.628906 0.628906 10.6436 0.628906 23.0002C0.628906 35.3565 10.6435 45.3711 23 45.3711C35.3565 45.3711 45.3711 35.3565 45.3711 23.0002C45.3711 10.6436 35.3565 0.628906 23 0.628906ZM23 43.5814C11.6518 43.5814 2.41859 34.3481 2.41859 23.0002C2.41859 11.652 11.6518 2.41859 23 2.41859C34.3481 2.41859 43.5814 11.6519 43.5814 23.0002C43.5814 34.3481 34.3481 43.5814 23 43.5814Z"
          fill="white"
        ></path>
        <path
          d="M33.1115 14.112L31.8461 12.8466L22.9877 21.7051L14.1713 12.8886L12.9059 14.154L21.7224 22.9705L12.9059 31.7875L14.1713 33.0529L22.9877 24.2353L31.8461 33.0949L33.1115 31.8294L24.2531 22.9705L33.1115 14.112Z"
          fill="white"
        ></path>
      </svg>

      <p>Your transaction failed :(</p>
      <button class="close" @click="close()">Close</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "app",
  data() {
    return {
      sendPage: true,
      amount: "",
      to: "",
      hash: false,
      errorMessage: false,
      errorHash: false,
      generating: false,
      confirmScreen: false,
      offline: false
    };
  },
  methods: {
    bgMessages(msg) {
      if (msg.action === "update") {
        this.offline = msg.data.offline;
      }

      if (msg.action === "setFields") {
        this.amount = msg.data.amount;
        this.to = msg.data.to;
      }

      if (msg.action === "errorMessage") {
        this.errorMessage = msg.data;
      }

      if (msg.action === "success") {
        this.sendPage = false;
        this.confirmScreen = false;
        this.hash = msg.data;
      }

      if (msg.action === "failure") {
        this.sendPage = false;
        this.errorHash = true;
      }

      if (msg.action === "generating") {
        this.generating = true;
      }

      if (msg.action === "confirm") {
        this.confirmScreen = msg.data;
        this.sendPage = false;
      }
    },
    close() {
      this.$bus.postMessage({ action: "close" });
    },

    toConfirm() {
      this.errorMessage = false;
      if (this.offline) {
        this.errorMessage = "You are disconnected";
        return;
      }

      if (this.amount.length == 0) {
        this.errorMessage = "Amount-field is empty";
        return;
      }

      if (this.to.length == 0) {
        this.errorMessage = "Address-field is empty";
        return;
      }

      this.$bus.postMessage({
        action: "deepSend",
        data: { amount: this.amount, to: this.to.trim(), confirmed: false }
      });
    },

    trySend() {
      this.$bus.postMessage({
        action: "deepSend",
        data: {
          amount: this.amount,
          to: this.to.trim(),
          confirmed: true
        }
      });
    },

    toHash() {
      let result = "https://nanocrawler.cc/explorer/block/" + this.hash;
      window.open(result, "_blank");
    }
  },
  created() {
    this.$bus.onMessage.addListener(this.bgMessages);
    this.$bus.postMessage({ action: "setFields" });
    this.$bus.postMessage({ action: "update" });
  }
};
</script>

<style lang="scss">
@font-face {
  font-family: "RobotoMonoBold";
  src: url("../fonts/RobotoMono-Bold.ttf") format("truetype");
}

@font-face {
  font-family: "RobotoMonoMedium";
  src: url("../fonts/RobotoMono-Medium.ttf") format("truetype");
}

@font-face {
  font-family: "RubikRegular";
  src: url("../fonts/Rubik-Regular.ttf") format("truetype");
}

@font-face {
  font-family: "RubikItalic";
  src: url("../fonts/Rubik-Italic.ttf") format("truetype");
}

@font-face {
  font-family: "RubikMedium";
  src: url("../fonts/Rubik-Medium.ttf") format("truetype");
}

@font-face {
  font-family: "RubikBlack";
  src: url("../fonts/Rubik-Black.ttf") format("truetype");
}

$primary_color: #2f55df;
$font_color: #222426;

html,
body {
  padding: 0;
  margin: 0;
  background: #f7f7f7;
  color: $font_color;
  font-family: "RubikMedium", sans-serif;
  font-weight: 400;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100%;
}

h1,
h2,
h3,
h4,
h5,
h6,
p {
  margin: 0;
  padding: 0;
  font-weight: 0;
}

.error {
  opacity: 0;
  color: #df4b54;
  font-weight: 500;
  text-align: center;
  padding: 10px 0;
  font-size: 12px;
}

.errorMessage {
  opacity: 1;
}

.header {
  height: 85px;
  background-color: #2f55df;
  color: #fff;
  font-style: normal;
  h1 {
    padding-top: 20px;
    font-size: 18px;
    font-weight: 500;
    line-height: 23px;
  }

  p {
    padding-top: 5px;
    font-style: normal;
    font-weight: normal;
    font-size: 12px;
    line-height: 16px;
  }
}

.divider {
  height: 2px;
  background-color: #f7f7f7;
}

.overview {
  background-color: #fff;

  h5 {
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    color: rgba(34, 36, 38, 0.3);
  }

  .amount {
    font-family: "RobotoMonoBold", sans-serif;
    font-size: 24px;
    line-height: 31px;
    color: #222426;
  }

  .to {
    font-family: "RobotoMonoBold", sans-serif;
    font-size: 12px;
    line-height: 15px;
    color: #222426;
    max-width: 230px;
    word-wrap: break-word;
  }

  .toField,
  .amountField {
    padding: 15px 25px;
  }
}

.buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;

  button {
    height: 50px;
    border: none;
    color: #fff;
    font-size: 16px;
    line-height: 21px;
    text-align: center;
    width: 50%;
    outline: none;
    cursor: pointer;
  }

  .send {
    background-color: #2f55df;
  }

  .reject {
    background-color: #1e3fba;
  }
}

.generating {
  background-color: #2f55df;
  width: 100%;
  height: 50px;
  display: flex;
  justify-content: center;

  width: 100%;
  font-family: "RubikMedium";
  position: absolute;
  bottom: 0;
  height: 50px;
  border: none;
  font-size: 15px;
  line-height: 21px;
  color: #ffffff;
  svg {
    margin: 5px;
  }
}

.confirmField {
  .overview {
    text-align: center;
    background-color: #1f378d;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    top: 85px;
    color: rgba(255, 255, 255, 0.27);
    font-family: "RubikMedium", sans-serif;
    font-size: 15px;
    line-height: 17px;
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
      word-break: break-all;
      box-sizing: border-box;
      padding-top: 5px;
      margin: 0 auto;
      max-width: 237px;
    }
  }

  button.confirm {
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
      background-color: #466eff !important;
    }
  }
}

.responseField {
  background-color: #2f55df;
  height: 100%;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  color: #fff;

  p {
    padding: 15px;
  }

  h5 {
    font-size: 12px;
    padding: 10px 0;
  }

  svg {
    padding: 40px 0 10px 0;
  }

  button {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    border: none;
    background-color: #253c92;
    width: 100%;
    height: 50px;
    font-size: 16px;
    color: #fff;
    font-family: "RubikMedium", sans-serif;
    cursor: pointer;
    outline: none;
  }
}

.hash {
  width: 140px;
  word-break: break-word;
  font-family: "RobotoMonoBold", sans-serif;
  font-size: 14px;
  line-height: 19px;
  text-align: right;
  color: rgba(255, 255, 255, 0.3);
  margin: 0 auto;
  cursor: pointer;
  text-decoration: underline;
}

.container {
  padding: 0 25px;
}

button {
  font-family: "RubikMedium", sans-serif;
  transition: all 0.6s ease;
}

button:hover {
  background-color: #162b79 !important;
}
</style>



