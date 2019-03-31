<template>
  <div class="delete">
    <div class="header">
      <div class="headerText no-hl container">
        <h1>Delete wallet</h1>
        <p>Backup your seed before destroying it.</p>
      </div>
    </div>

    <div class="overview container">
      <svg
        width="57"
        height="49"
        viewBox="0 0 57 49"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M28.5 0L0 49H57L28.5 0ZM28.5 10.3158L48.0095 43.8421H8.99045L28.5 10.3158ZM25.9091 20.6316V30.9474H31.0909V20.6316H25.9091ZM25.9091 36.1053V41.2632H31.0909V36.1053"
          fill="#DF4B54"
        ></path>
      </svg>

      <div class="delete">
        <label for="sure" ref="label" class="checkbox">
          <input type="checkbox" name="sure" id="sure" v-model="checked">
          I understand that I will remove my local wallet.
          <b>VANO cannot restore the wallet. Make sure you have a backup.</b>
        </label>
        <button class="remove" @click="removeData">Remove wallet &amp; Proceed</button>
      </div>
    </div>
  </div>
</template>

<script>
import navigation from "../navigation.js";

export default {
  name: "delete",
  data() {
    return {
      checked: false
    };
  },
  methods: {
    bgMessages(msg) {},

    removeData() {
      this.$refs.label.classList.remove("errorMessage");
      if (this.checked) {
        this.$bus.postMessage({ action: "removeWallet" });
        return;
      }
      this.$refs.label.classList.add("errorMessage");
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

.errorMessage {
  color: #df4b54;
}

.header {
  height: 123px;
  p {
    padding-right: 0;
  }
}

.overview {
  div {
    margin-top: 30px;
  }

  svg {
    margin: 40px auto 0 auto;
    display: block;
  }
}

.checkbox {
  display: inline-block;
  vertical-align: top;
  padding-left: 25px;
  position: relative;
}

.checkbox input {
  position: absolute;
  left: 0;
  top: 0;
}

label {
  width: 90%;
  font-style: normal;
  font-weight: normal;
  font-size: 11px;
  line-height: 18px;
  color: #222426;
}

p {
  padding-right: 25px;
}

button {
  font-family: "RubikMedium";
  width: 230px;
  border: none;
  background: #2f55df;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  color: #ffffff;
  border-radius: 2px;
  height: 40px;
  cursor: pointer;
  margin-top: 10px;
  &:hover {
    background-color: #466eff;
  }
}
</style>
