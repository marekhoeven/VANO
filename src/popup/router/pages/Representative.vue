<template>
  <div class="representative">
    <div class="header">
      <div class="headerText no-hl container">
        <h1>Representative</h1>
      </div>
    </div>
    <div class="address">
      <div class="container">Your current representative:</div>
      <span ref="currRep" class="container currRepr">{{representative}}</span>
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
      :class="{notClick : (changing && !isProcessing) && !succesChange, 'successChange': succesChange}"
      :disabled="succesChange || (changing && !isProcessing)"
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
      succesChange: false,
      offline: false,
      isProcessing: false
    };
  },
  computed: {
    isChanging() {
      if (this.succesChange) {
        return "Successfully changed!";
      } else if (this.changing && !this.isProcessing) {
        return "Changing...";
      } else {
        return "Change representative";
      }
    }
  },
  methods: {
    bgMessages(msg) {
      if (msg.action === "update") {
        this.representative = msg.data.representative;
        this.changing = msg.data.isGenerating;
        this.offline = msg.data.offline;
        this.isProcessing = msg.data.isProcessing;
      }

      if (msg.action === "changedRep") {
        this.representative = msg.data;
        this.succesChange = true;
        this.new_representative = "";
        this.$refs.currRep.classList.add("success");
        this.changing = false;
        setTimeout(() => {
          this.succesChange = false;
          this.$refs.currRep.classList.remove("success");
        }, 2000);
      }

      if (msg.action === "errorMessage") {
        this.errorMessage = msg.data;
        this.changing = false;
      }
    },
    change() {
      this.errorMessage = false;
      if (this.offline) {
        this.errorMessage = "You are disconnected";
        return;
      }
      this.changing = true;
      this.$bus.postMessage({
        action: "changeRepresentative",
        data: this.new_representative.trim()
      });
    }
  },
  beforeMount() {
    this.$bus.onMessage.addListener(this.bgMessages);
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

h1 {
  padding-bottom: 20px;
  font-size: 17px;
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
  font-family: "RubikMedium", sans-serif;
}

.wallet {
  background-color: #f7f7f7 !important;
  height: 100%;
}

.header {
  height: 123px;
}

.address {
  font-family: "RubikMedium", sans-serif;
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
    font-family: "RobotoMonoBold", sans-serif;
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
  font-family: "RubikMedium";
  width: 100%;
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
    background-color: #466eff;
  }
}

textarea {
  border: 0;
  width: 230px;
  background-color: #fff;
  box-sizing: border-box;
  padding: 7px 0 7px 12px;
  margin: 5px 0 0 0;
  outline: none;
  padding-right: 20px;
  border: 1px solid transparent;
  resize: none;
  height: 70px;
  outline: none;
  overflow: hidden;
  font-family: "RobotoMonoMedium", sans-serif;
  font-size: 12px;
  line-height: 16px;
  &::placeholder {
    line-height: 16px;
    font-size: 12px;
    color: rgba(34, 36, 38, 0.3);
    font-family: "RobotoMonoMedium", sans-serif;
  }
}
</style>
