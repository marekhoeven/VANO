<template>
  <div class="navigation">
    <div class="items">
      <svg
        class="back"
        width="7"
        height="10"
        viewBox="0 0 7 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        @click="toPage(from)"
        v-if="backPage"
      >
        <path
          d="M6.17499 1.175L2.35832 5L6.17499 8.825L4.99999 10L-1.19209e-05 5L4.99999 0L6.17499 1.175Z"
          fill="white"
        ></path>
      </svg>

      <div class="settings" v-if="settings" @click="showMenu = !showMenu" width="13" height="13">
        <svg
          width="13"
          height="13"
          viewBox="0 0 13 13"
          xmlns="http://www.w3.org/2000/svg"
          fill="white"
          style="position: relative; z-index: -3"
        >
          <path
            class="settingPath"
            d="M6.50148 8.775C5.88118 8.775 5.28629 8.53531 4.84768 8.10867C4.40907 7.68202 4.16265 7.10337 4.16265 6.5C4.16265 5.89663 4.40907 5.31798 4.84768 4.89133C5.28629 4.46469 5.88118 4.225 6.50148 4.225C7.12177 4.225 7.71666 4.46469 8.15527 4.89133C8.59389 5.31798 8.8403 5.89663 8.8403 6.5C8.8403 7.10337 8.59389 7.68202 8.15527 8.10867C7.71666 8.53531 7.12177 8.775 6.50148 8.775ZM11.4665 7.1305C11.4932 6.9225 11.5132 6.7145 11.5132 6.5C11.5132 6.2855 11.4932 6.071 11.4665 5.85L12.8764 4.7905C13.0034 4.693 13.0368 4.5175 12.9566 4.3745L11.6202 2.1255C11.54 1.9825 11.3595 1.924 11.2125 1.9825L9.54863 2.6325C9.20114 2.379 8.8403 2.158 8.41931 1.9955L8.17206 0.273C8.14533 0.117 8.005 0 7.83794 0H5.16501C4.99795 0 4.85762 0.117 4.83089 0.273L4.58364 1.9955C4.16265 2.158 3.80181 2.379 3.45433 2.6325L1.79042 1.9825C1.64341 1.924 1.46299 1.9825 1.3828 2.1255L0.0463297 4.3745C-0.0405407 4.5175 -0.000446586 4.693 0.126518 4.7905L1.53649 5.85C1.50976 6.071 1.48972 6.2855 1.48972 6.5C1.48972 6.7145 1.50976 6.9225 1.53649 7.1305L0.126518 8.2095C-0.000446586 8.307 -0.0405407 8.4825 0.0463297 8.6255L1.3828 10.8745C1.46299 11.0175 1.64341 11.0695 1.79042 11.0175L3.45433 10.361C3.80181 10.621 4.16265 10.842 4.58364 11.0045L4.83089 12.727C4.85762 12.883 4.99795 13 5.16501 13H7.83794C8.005 13 8.14533 12.883 8.17206 12.727L8.41931 11.0045C8.8403 10.8355 9.20114 10.621 9.54863 10.361L11.2125 11.0175C11.3595 11.0695 11.54 11.0175 11.6202 10.8745L12.9566 8.6255C13.0368 8.4825 13.0034 8.307 12.8764 8.2095L11.4665 7.1305Z"
            fill="white"
          ></path>
        </svg>
      </div>

      <div class="settingsMenu no-hl" v-show="showMenu" ref="menu">
        <a
          v-if="isUnlocked"
          @click="lockWallet"
          style="color: #df4b54; font-weight: 500"
        >Lock wallet</a>
        <a v-if="isUnlocked" @click="toPage('representative')">Change representative</a>
        <a @click="toPage('settings')">Change password</a>
        <a @click="toPage('settings')">Backup wallet</a>
        <a @click="toPage('settings')">Delete wallet</a>
      </div>
    </div>
  </div>
</template>

<script>
import navigation from "./router/navigation.js";

export default {
  name: "mainheader",
  data() {
    return {
      backPage: false,
      settings: true,
      from: "",
      showMenu: false,
      isUnlocked: false,
      warning: false
    };
  },
  methods: {
    bgMessages(msg) {
      if (msg.action === "isLocked") {
        this.isUnlocked = !msg.data;
        if (this.isUnlocked) {
          this.from = "dashboard";
        } else {
          this.from = "locked";
          if (["create", "import"].includes(this.$router.currentRoute.name)) {
            this.from = "welcome";
          }
        }
      }
    },

    close(e) {
      if (!e.target.classList.contains("settings")) {
        if (!this.$refs.menu.contains(e.target)) {
          this.showMenu = false;
        }
      }
    },

    lockWallet() {
      this.$bus.postMessage({ action: "lockWallet" });
    }
  },
  created() {
    window.addEventListener("click", this.close);
  },

  beforeMount() {
    this.$bus.onMessage.addListener(this.bgMessages);
    this.$bus.postMessage({ action: "isLocked" });
  },

  beforeUpdate() {
    this.$bus.postMessage({ action: "isLocked" });
  },

  beforeDestroy() {
    window.removeEventListener("click", this.close);
  },
  watch: {
    $route(to, from) {
      this.showMenu = false;

      this.backPage = [
        "create",
        "import",
        "send",
        "transactions",
        "receive",
        "settings",
        "representative"
      ].includes(to.name);

      this.settings = [
        "dashboard",
        "locked",
        "transactions",
        "receive",
        "send"
      ].includes(to.name);
    }
  },
  mixins: [navigation]
};
</script>

<style lang="scss" scoped>
.navigation {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  width: 280px;
}

.items {
  display: flex;
  padding: 20px 25px 0;
}

.back {
  cursor: pointer;
  padding: 5px 7px;
  border-radius: 100%;
  position: relative;
  left: -5px;
  top: -5px;
  &:hover {
    background-color: #466eff;
  }
}

.settings {
  margin-left: auto;
  cursor: pointer;
  position: relative;
  z-index: 10;
}

.settingsMenu {
  font-family: "RubikMedium", sans-serif;
  position: absolute;
  right: 29px;
  top: 35px;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  padding: 3px 0;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  z-index: 11;

  a {
    padding: 5px 12px;
    cursor: pointer;
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    color: rgba(34, 36, 38, 1);
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }

  a:first-child {
    border-top: 1px solid transparent;
  }

  a:hover {
    background-color: rgba(34, 36, 38, 0.05);
    border-top: 1px solid transparent;
  }
}
</style>
