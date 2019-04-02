<template>
  <div class="locked">
    <div class="header">
      <div class="headerText no-hl container">
        <h1>Wallet locked</h1>
      </div>
    </div>

    <div class="lock">
      <svg
        :class="{'shake': wrong}"
        width="30"
        height="39"
        viewBox="0 0 30 39"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M26.25 13H24.375V9.28571C24.375 4.16 20.175 0 15 0C9.825 0 5.625 4.16 5.625 9.28571V13H3.75C1.6875 13 0 14.6714 0 16.7143V35.2857C0 37.3286 1.6875 39 3.75 39H26.25C28.3125 39 30 37.3286 30 35.2857V16.7143C30 14.6714 28.3125 13 26.25 13ZM15 29.7143C12.9375 29.7143 11.25 28.0429 11.25 26C11.25 23.9571 12.9375 22.2857 15 22.2857C17.0625 22.2857 18.75 23.9571 18.75 26C18.75 28.0429 17.0625 29.7143 15 29.7143ZM20.8125 13H9.1875V9.28571C9.1875 6.11 11.7937 3.52857 15 3.52857C18.2062 3.52857 20.8125 6.11 20.8125 9.28571V13Z"
          fill="#3C48D2"
        ></path>
      </svg>
    </div>

    <div class="pwArea">
      <input
        type="password"
        class="pw"
        v-model="pw_unlock"
        :class="{'error': wrong}"
        placeholder="Enter password"
        v-on:keyup.enter="unlockSeed"
        autocomplete="off"
      >
      <button class="no-hl" @click="unlockSeed">Unlock wallet</button>
    </div>
  </div>
</template>

<script>
import navigation from "../navigation.js";
export default {
  name: "locked",
  data() {
    return {
      pw_unlock: "",
      wrong: false
    };
  },
  methods: {
    unlockSeed() {
      this.wrong = false;
      this.$bus.postMessage({ action: "unlock", data: this.pw_unlock });
    },

    bgMessages(msg) {
      if (msg.action === "errorMessage") this.wrong = true;
    }
  },
  created() {
    this.$bus.onMessage.addListener(this.bgMessages);
  },
  mixins: [navigation]
};
</script>

<style lang="scss" scoped>
.header {
  height: 123px;
}

h1 {
  padding-bottom: 20px;
  font-size: 17px;
}

.shake {
  animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  transform: translate3d(0, 0, 0);
}

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }

  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}

.locked {
  background-color: #fff !important;
  height: 100%;
}

.lock {
  display: flex;
  justify-content: center;
  padding: 40px 0 30px 0;
}

.pwArea {
  display: flex;
  flex-direction: column;
  align-items: center;
}

input,
button {
  width: 230px;
  border: none;
}

input {
  background: #f7f7f7;
  border-radius: 2px;
  height: 35px;
  color: rgba(34, 36, 38, 1);
  outline: none;
  box-sizing: border-box;
  padding: 10px 15px;
  border: 1px solid transparent;

  &::placeholder {
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    color: rgba(34, 36, 38, 0.4);
  }
}

button {
  background: #2f55df;
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  text-align: center;
  color: #ffffff;
  border-radius: 2px;
  height: 40px;
  position: relative;
  top: 15px;
  cursor: pointer;

  &:hover {
    background-color: #466eff;
  }
}
</style>
