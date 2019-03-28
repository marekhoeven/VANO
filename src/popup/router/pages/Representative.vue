<template>
  <div class="representative">
    <div class="header container">
      <div class="headerText no-hl">
        <h1>Representative</h1>
        <p>Change your representative node</p>
      </div>
    </div>
    <div class="address container">
      <div>Your current representative:</div>
      <span ref="currRep">{{representative}}</span>
    </div>

    <div class="overview">
      <textarea
        type="text"
        placeholder="New representative"
        v-model="new_representative"
        ref="representative"
        autocomplete="off"
        spellcheck="false"
      ></textarea>
    </div>
    <p class="errorMessage" v-show="errorMessage">{{errorMessage}}</p>
    <button
      class="change"
      ref="changeButton"
      :class="{notClick : changing, 'successChange': succesChange}"
      :disabled="succesChange"
      @click="change"
    >{{isChanging}}</button>
  </div>
</template>

<script>
import navigation from "../navigation.js";
import { setTimeout } from "timers";
import { checksumAccount } from "../../../utils/services.js";
export default {
  name: "create",
  data() {
    return {
      representative: "",
      new_representative: "",
      errorMessage: false,
      changing: false,
      frontier:
        "0000000000000000000000000000000000000000000000000000000000000000",
      succesChange: false
    };
  },
  computed: {
    isChanging() {
      if (this.changing) {
        return "Changing...";
      } else if (this.succesChange) {
        return "Successfully changed!";
      } else {
        return "Change representative";
      }
    }
  },
  methods: {
    bgMessages(msg) {
      if (msg.action === "representative") {
        this.representative = msg.data;
      }
      if (msg.action === "rep_changed") {
        this.changing = false;
        this.succesChange = true;
        this.new_representative = "";
        this.representative = msg.data;
        this.$refs.currRep.classList.add("success");

        setTimeout(() => {
          this.succesChange = false;
          this.$refs.currRep.classList.remove("success");
          this.$refs.changeButton.classList.remove("successChange");
        }, 4000);
      }
      if (msg.action === "update") {
        this.frontier = msg.data.frontier;
      }

      if (msg.action === "errorMessage") {
        this.errorMessage = msg.data;
        this.changing = false;
      }
    },
    change() {
      this.errorMessage = false;
      if (!this.changing) {
        if (this.new_representative.trim() === "") {
          this.errorMessage = "Empty field";
          return;
        }

        if (this.new_representative.trim() === this.representative) {
          this.errorMessage = "Same representative";
          return;
        }

        if (!checksumAccount(this.new_representative.trim())) {
          this.errorMessage = "Not a valid address";
          return;
        }

        if (
          this.frontier ===
          "0000000000000000000000000000000000000000000000000000000000000000"
        ) {
          this.errorMessage = "No open blocks yet";
          return;
        }

        this.changing = true;
        this.$bus.postMessage({
          action: "changeRepresentative",
          data: this.new_representative.trim()
        });
      }
    }
  },
  created() {
    this.$bus.onMessage.addListener(this.bgMessages);
    this.$bus.postMessage({
      action: "representative"
    });

    this.$bus.postMessage({
      action: "update"
    });
  },
  mixins: [navigation]
};
</script>

<style lang="scss" scoped>
button.successChange {
  background-color: #4bb18d !important;
}

.notClick {
  cursor: default !important;
  background-color: #2f55df !important;
  opacity: 0.5;
}

.success {
  color: #4bb18d !important;
}

.errorMessage {
  color: #df4b54;
  text-align: center;
  width: 100%;
  position: relative;
  top: -4px;
  font-weight: bold;
}

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

.overview {
  padding-top: 17px;
  display: flex;
  justify-content: center;
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

textarea {
  border: 0;
  width: 230px;
  background-color: #fff;
  box-sizing: border-box;
  padding: 7px 0 7px 12px;
  margin: 5px 0 0 0;
  outline: none;
  font-weight: 700;
  padding-right: 20px;
  border: 1px solid transparent;
  resize: none;
  height: 70px;
  outline: none;
  overflow: hidden;

  &::placeholder {
    font-style: normal;
    font-weight: 700;
    line-height: 16px;
    font-size: 12px;
    color: rgba(34, 36, 38, 0.3);
  }
}
</style>
