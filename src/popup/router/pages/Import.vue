<template>
  <div class="import">
    <div class="header">
      <div class="headerText container">
        <h1>Import wallet</h1>
        <p>
          Your NANO seed is stored locally and protected by a password.
          <span
            class="bold"
          >VANO cannot restore your seed or password.</span>
        </p>
      </div>
    </div>

    <div class="inputWrapper container">
      <textarea
        type="text"
        placeholder="YOUR NANO SEED"
        v-model="seed"
        maxlength="64"
        autocomplete="off"
        :class="{error : seedError}"
      ></textarea>
      <input
        type="password"
        placeholder="Password"
        v-model="pw"
        autocomplete="off"
        :class="{error : pwError}"
      >
      <input
        type="password"
        placeholder="Re-enter password"
        v-model="re_enter"
        autocomplete="off"
        :class="{error : re_pwError}"
      >
    </div>

    <button @click="checkImportValues">Import &amp; Proceed</button>
  </div>
</template>

<script>
import navigation from "../navigation.js";
import {
  getLocalStorageItem,
  setLocalStorageItem
} from "../../../utils/services.js";

export default {
  name: "import",
  data() {
    return {
      seed: "",
      pw: "",
      re_enter: "",
      seedError: false,
      pwError: false,
      re_pwError: false
    };
  },

  watch: {
    seed() {
      setLocalStorageItem("inputSeed", this.seed);
    }
  },
  methods: {
    bgMessages(msg, sender) {
      if (msg.action === "errorMessage") {
        let error = msg.data;
        if (error === "seed") this.seedError = true;
        if (error === "pw") this.pwError = true;
        if (error === "re_pw") this.re_pwError = true;
      }
    },

    checkImportValues() {
      this.seedError = false;
      this.pwError = false;
      this.re_pwError = false;
      let values = { seed: this.seed, pw: this.pw, re_pw: this.re_enter };
      this.$bus.postMessage({ action: "import", data: values });
    }
  },

  async beforeMount() {
    this.seed = (await getLocalStorageItem("inputSeed")) || "";
    this.$bus.onMessage.addListener(this.bgMessages);
  },

  beforeDestroy() {
    chrome.storage.local.remove(["inputSeed"], function() {});
  },
  mixins: [navigation]
};
</script>

<style lang="scss" scoped>
.import {
  background-color: #fff;
  height: 390px;
}

.inputWrapper {
  input:first-child {
    margin-top: 20px;
    text-transform: uppercase;
  }

  input {
    border: 0;
    width: 230px;
    background-color: #f7f7f7;
    box-sizing: border-box;
    padding: 7px 0 7px 12px;
    margin: 5px 0 0 0;
    outline: none;
    font-weight: 700;
    padding-right: 20px;
    border: 1px solid transparent;
    &::placeholder {
      font-style: normal;
      font-weight: 700;
      line-height: 16px;
      font-size: 12px;
      color: rgba(34, 36, 38, 0.3);
    }
  }
}

button {
  border: none;
  border-radius: 2px;
  color: #fff;
  font-style: normal;
  font-weight: 600;
  line-height: 18px;
  font-size: 14px;
  background-color: #2f55df;
  width: 230px;
  height: 40px;
  background: #2f55df;
  border-radius: 2px;
  margin: 10px auto 0 auto;
  display: block;
  outline: none;
  cursor: pointer;

  &:hover {
    background-color: #466eff;
  }
}

textarea {
  background-color: #f7f7f7;
  font-family: "RobotoMonoBold";
  font-size: 13px;
  text-align: justify;
  letter-spacing: 0.35em;
  color: rgba(34, 36, 38, 0.3);
  white-space: pre-wrap;
  word-wrap: break-word;
  width: 200px;
  overflow: hidden;
  padding: 6px 15px 0px 15px;
  margin: 9px auto 0 auto;
  border: 1px solid transparent;
  resize: none;
  height: 86px;
  outline: none;
  &::placeholder {
    font-family: "RubikMedium", sans-serif;
    font-weight: 500;
    color: rgba(34, 36, 38, 0.3);
    text-align: left;
    letter-spacing: 0.05em;
  }
}
</style>
