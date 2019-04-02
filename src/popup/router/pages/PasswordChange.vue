<template>
  <div class="changepassword">
    <div class="header">
      <div class="headerText no-hl container">
        <h1>Change password</h1>
      </div>
    </div>

    <div class="overview container">
      <div class="change">
        <input
          ref="old_pw"
          type="password"
          placeholder="Enter old password"
          autocomplete="off"
          v-model="old_pw"
          class="old_pw"
        >
        <div class="divider"></div>
        <input
          ref="new_pw"
          type="password"
          placeholder="Enter new password"
          autocomplete="off"
          v-model="new_pw"
        >
        <input
          ref="re_pw"
          type="password"
          placeholder="Re-enter new password"
          autocomplete="off"
          v-model="re_pw"
        >
        <button @click="changePw">Change password &amp; Proceed</button>
      </div>
    </div>
  </div>
</template>

<script>
import navigation from "../navigation.js";
import {
  getLocalStorageItem,
  setLocalStorageItem,
  decryptString,
  encryptString
} from "../../../utils/services.js";

export default {
  name: "changepassword",
  data() {
    return {
      old_pw: "",
      new_pw: "",
      re_pw: "",
      show_pw: "",
      checked: false,
      showTheSeed: false
    };
  },
  methods: {
    bgMessages(msg) {},

    async changePw() {
      let encryptedSeed = (await getLocalStorageItem("seed")) || false;
      if (!encryptedSeed) toPage("welcome");

      this.$refs.old_pw.classList.remove("error");
      this.$refs.new_pw.classList.remove("error");
      this.$refs.re_pw.classList.remove("error");

      try {
        let seed = decryptString(encryptedSeed, this.old_pw);

        if (!/[0-9A-Fa-f]{64}/g.test(seed) || this.old_pw.length < 2) {
          this.$refs.old_pw.classList.add("error");
          return;
        }

        if (this.new_pw.length < 2) {
          this.$refs.new_pw.classList.add("error");
          return;
        }
        if (this.re_pw.length < 2) {
          this.$refs.re_pw.classList.add("error");
          return;
        }
        if (this.new_pw !== this.re_pw) {
          this.$refs.re_pw.classList.add("error");
          return;
        }

        let newEncryptedSeed = encryptString(seed, this.new_pw);
        await setLocalStorageItem("seed", newEncryptedSeed);
        this.$bus.postMessage({ action: "lock" });
      } catch (err) {
        console.log(err);
        this.$refs.old_pw.classList.add("error");
        return;
      }
    }
  },
  beforeMount() {
    this.$bus.onMessage.addListener(this.bgMessages);
  },
  mixins: [navigation]
};
</script>

<style lang="scss" scoped>
.wallet {
  background-color: #f7f7f7 !important;
  height: 100%;
}

h1 {
  padding-bottom: 20px;
}

.errorMessage {
  color: #df4b54;
}

.header {
  height: 123px;
}

.overview {
  div {
    padding: 20px 0;
  }

  .divider {
    height: 1px;
    background-color: rgba(34, 36, 38, 0.1);
    padding: 0;
    margin-top: 10px;
  }

  .change {
    input:first-child {
      margin-top: none;
    }

    button {
      margin-top: 20px;
    }
  }
}

p {
  padding-right: 25px;
}

button {
  width: 230px;
  border: none;
  background: #2f55df;
  font-style: normal;
  font-weight: 600;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  color: #ffffff;
  border-radius: 2px;
  height: 40px;
  cursor: pointer;
  &:hover {
    background-color: #466eff;
  }
}

input[type="password"] {
  width: 230px;
  background: #fff;
  border-radius: 2px;
  height: 25px;
  color: rgba(34, 36, 38, 1);
  outline: none;
  box-sizing: border-box;
  padding: 15px 15px;
  border: 1px solid transparent;
  margin-top: 12px;
  font-family: "RubikMedium", sans-serif;
  &::placeholder {
    font-family: "RubikMedium", sans-serif;
    font-size: 12px;
    color: rgba(34, 36, 38, 0.4);
  }
}
</style>
