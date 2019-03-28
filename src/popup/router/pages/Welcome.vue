<template>
  <div class="welcome">
    <div class="header">
      <div class="headerText container">
        <h1>Welcome</h1>
        <p>
          VANO is a light-wallet that interacts with NANO,
          a cryptocurrency with fast transactions and
          zero fees over a decentralised network.
        </p>
      </div>
    </div>

    <div class="links no-hl">
      <a class="link" @click="toPage('create')">
        <span class="link-items">
          <span>Create a new wallet</span>

          <svg width="7" height="10" viewBox="0 0 7 10" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 8.825L3.81667 5L0 1.175L1.175 0L6.175 5L1.175 10L0 8.825Z"></path>
          </svg>
        </span>
      </a>
      <a class="link" @click="toPage('import')">
        <span class="link-items">
          <span>Import a wallet</span>
          <svg width="7" height="10" viewBox="0 0 7 10" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 8.825L3.81667 5L0 1.175L1.175 0L6.175 5L1.175 10L0 8.825Z"></path>
          </svg>
        </span>
      </a>
    </div>
  </div>
</template>

<script>
import navigation from "../navigation.js";

export default {
  name: "welcome",
  data() {
    return {};
  },
  mixins: [navigation]
};
</script>

<style lang="scss" scoped>
.header {
  height: 207px;
}

.links {
  width: 100%;
  font-size: 12px;
  color: #222426;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  cursor: pointer;
  font-family: "RubikMedium", sans-serif;
  .link {
    display: flex;
    flex: 0 0 100%;
    background-color: #fff;
    align-items: center;
    height: 43px;
    fill-opacity: 0.2;
    justify-content: center;

    .link-items {
      display: flex;
      width: 230px;
      svg {
        margin-left: auto;
      }
    }
  }

  .link:last-child {
    border-top: 2px solid #f7f7f7;
  }

  .link:hover {
    path {
      fill-opacity: 1;
    }
  }
}
</style>
