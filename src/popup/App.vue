<template>
  <div class="app">
    <MainHeader></MainHeader>
    <router-view></router-view>

    <!-- <div class="offlineOverlay" v-if="offline">
      <div class="offline no-hl">
        Can't connect to the VANO servers.
        <br>
        <br>
        <button :disabled="disable" class="reconnectButton" @click="reconnect">Try to reconnect</button>
        <br>
        <br>
        <a @click="goToLock" class="goBackToLocked">or go back to the locked screen</a>
      </div>
    </div>-->
  </div>
</template>

<script>
import MainHeader from "./MainHeader";
// import { setTimeout } from "timers";
export default {
  name: "app",
  data() {
    return {
      // offline: false,
      // disable: false
    };
  },
  created() {
    this.$bus.onMessage.addListener(this.bgMessages);
    // this.$bus.postMessage({ action: "onlineCheck" });
  },
  methods: {
    bgMessages(msg, sender) {
      if (msg.action === "toPage") {
        this.$router.push({ name: msg.data });
      }
      //if (msg.action === "offline") this.offline = true;
      // if (msg.action === "online") this.offline = false;
    }
    // reconnect() {
    //   this.disable = true;
    //   setTimeout(() => {
    //     this.disable = false;
    //   }, 5000);
    //   this.$bus.postMessage({
    //     action: "reconnect"
    //   });
    // },

    // goToLock() {
    //   this.$bus.postMessage({ action: "lockWallet" });
    // }
  },
  components: { MainHeader }
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
  font-family: "RubikRegular", sans-serif;
  font-weight: 400;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 280px;
  height: 390px;
}

.app {
  width: 100%;
  height: 100%;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: "RubikMedium", sans-serif;
  margin: 0;
  padding: 0;
  font-weight: 0;
}

h1 {
  font-style: normal;
  font-weight: 500;
  line-height: 23px;
  font-size: 18px;
  color: #ffffff;
  position: relative;
  top: 5px;
}

p {
  line-height: 16px;
  font-size: 12px;
  color: #ffffff;
  padding: 0;
}

.container {
  display: block;
  margin: 0 auto;
  width: 230px;
}

.header {
  background-color: $primary_color;
  display: flex;
  align-items: flex-end;
  height: 160px;
  font-family: "RubikMedium", sans-serif;
  .headerText {
    p {
      padding-bottom: 10px;
    }
  }
}

.error {
  border: 1px solid #df4b54 !important;
}

.bold {
  font-family: "RubikMedium", sans-serif;
}

.no-hl {
  user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
  -o-user-select: none;
  -moz-user-select: none;
}

button,
input {
  outline: none;
}

button {
  transition: all 0.6s ease;
  &:hover {
    background-color: #162b79;
  }
}

button {
  border: none;
  border-radius: 2px;
  color: #fff;
  font-style: normal;
  font-size: 14px;
  background-color: #2f55df;
  width: 100%;
  height: 40px;
  cursor: pointer;
  transition: background-color 0.6s ease;
  &:hover {
    background-color: #162b79;
  }
}

a {
  color: $font_color;
  text-decoration: none;
}

// .offlineOverlay {
//   position: fixed;
//   top: 0;
//   bottom: 0;
//   left: 0;
//   right: 0;
//   z-index: 3;
//   background: rgba(34, 36, 38, 0.3);
// }

// .offline {
//   position: relative;
//   width: 80%;
//   margin: 140px auto 0 auto;
//   text-align: center;
//   background-color: #df4b54;
//   padding: 30px 8px;
//   font-weight: 500;
//   border-radius: 2px;
//   color: #fff;
//   z-index: 5;
//   box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.15);
// }

// .reconnectButton {
//   border: none;
//   font-size: 14px;
//   padding: 5px 10px;
//   margin-top: 5px;
//   box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
//   font-weight: 500;
//   cursor: pointer;
// }

// .reconnectButton:hover {
//   background-color: #fff !important;
// }

// .goBackToLocked {
//   color: #fff;
//   text-decoration: underline;
//   cursor: pointer;
// }
</style>



