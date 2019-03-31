<template>
  <div class="create">
    <div class="header">
      <div class="headerText container">
        <h1>Wallet created</h1>
        <p>
          The seed below is the master key to your NANO wallet.
          <span
            class="bold"
          >Make sure to write it down and save it somewhere safe!</span>
        </p>
      </div>
    </div>

    <div class="overview">
      <div class="seedContainer container">
        <span class="seed">{{generated_seed}}</span>
      </div>
    </div>
    <div class="copyHolder">
      <svg
        class="retry"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        @click="retry"
      >
        <path
          d="M7.87501 9.91666C8.88062 9.91666 9.84504 9.51719 10.5561 8.80611C11.2672 8.09504 11.6667 7.13061 11.6667 6.125C11.6667 5.11939 11.2672 4.15496 10.5561 3.44389C9.84504 2.73281 8.88062 2.33333 7.87501 2.33333H5.83334L5.83334 3.5H7.87501C9.33334 3.5 10.5 4.66667 10.5 6.125C10.5 7.58333 9.33334 8.75 7.87501 8.75H4.56751L6.36417 6.9475L5.54167 6.125L2.33334 9.33333L5.54167 12.5417L6.37001 11.7192L4.56751 9.91666H7.87501ZM3.50001 3.5H4.66667L4.66667 2.33333H3.50001V3.5Z"
          fill="#222426"
        ></path>
      </svg>

      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        class="copy"
        xmlns="http://www.w3.org/2000/svg"
        @click="copied()"
      >
        <path
          d="M11.0833 12.25H4.66667V4.08334H11.0833V12.25ZM11.0833 2.91667H4.66667C4.35725 2.91667 4.06051 3.03959 3.84171 3.25838C3.62292 3.47717 3.50001 3.77392 3.50001 4.08334V12.25C3.50001 12.5594 3.62292 12.8562 3.84171 13.075C4.06051 13.2938 4.35725 13.4167 4.66667 13.4167H11.0833C11.3928 13.4167 11.6895 13.2938 11.9083 13.075C12.1271 12.8562 12.25 12.5594 12.25 12.25V4.08334C12.25 3.77392 12.1271 3.47717 11.9083 3.25838C11.6895 3.03959 11.3928 2.91667 11.0833 2.91667V2.91667ZM9.33334 0.583336H2.33334C2.02392 0.583336 1.72717 0.706252 1.50838 0.925045C1.28959 1.14384 1.16667 1.44058 1.16667 1.75V9.91667H2.33334V1.75H9.33334V0.583336Z"
          fill="#222426"
        ></path>
      </svg>
      <span class="copied" v-bind:class="{ show: copy_clicked }">COPIED!</span>
    </div>
    <button @click="toPage('import')" class="no-hl">I've saved my seed</button>
  </div>
</template>

<script>
import navigation from "../navigation.js";
import {
  generateSeedBytes,
  uint8ToHex,
  getLocalStorageItem,
  setLocalStorageItem
} from "../../../utils/services.js";

export default {
  name: "create",
  data() {
    return {
      generated_seed: "",
      copy_clicked: false
    };
  },
  methods: {
    retry() {
      this.generated_seed = uint8ToHex(generateSeedBytes());
      setLocalStorageItem("generatedSeed", this.generated_seed);
    },

    copied() {
      this.$copyText(this.generated_seed);
      this.copy_clicked = true;
      setTimeout(() => {
        this.copy_clicked = false;
      }, 400);
    }
  },
  async beforeMount() {
    this.generated_seed = (await getLocalStorageItem("generatedSeed")) || false;

    if (!this.generated_seed) {
      this.generated_seed = uint8ToHex(generateSeedBytes());
      setLocalStorageItem("generatedSeed", this.generated_seed);
    }
  },

  beforeDestroy() {
    chrome.storage.local.remove(["generatedSeed"], function() {});
  },

  mixins: [navigation]
};
</script>

<style lang="scss" scoped>
.create {
  background-color: #fff;
  height: 390px;
}

.overview {
  padding: 20px 0 0 0;
  background-color: #fff;
}

.seedContainer {
  background-color: #f7f7f7;
  box-sizing: border-box;
  padding: 10px 10px 35px 15px;
}

.seed {
  font-family: "RobotoMonoMedium";
  line-height: 21px;
  font-size: 15px;
  letter-spacing: 0.23em;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: rgba(34, 36, 38, 0.3);
  text-align: justify;
  width: 230px;
}

.copyHolder {
  display: flex;
  justify-content: center;
  position: relative;
  top: -30px;
  width: 280px;
}

.copy {
  color: #222426;
  cursor: pointer;
  position: relative;
  left: 15px;
  padding: 5px;
  border-radius: 100%;
  &:hover {
    background-color: #e6e6e6;
  }
}

.retry {
  color: #222426;
  cursor: pointer;
  padding: 5px;
  border-radius: 100%;
  &:hover {
    background-color: #e6e6e6;
  }
}

.copied {
  visibility: hidden;
  text-transform: uppercase;
  font-family: "RubikMedium";
  color: #42a07f;
  transition: all 1s;
  font-size: 11px;
  position: relative;
  left: 23px;
  top: 6px;
}

.show {
  visibility: visible;
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
  margin: 0 auto;
  display: block;
  outline: none;
  cursor: pointer;

  &:hover {
    background-color: #466eff;
  }
}
</style>
