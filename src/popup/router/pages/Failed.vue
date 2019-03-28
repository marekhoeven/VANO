<template>
  <div class="errorPage">
    <svg
      width="46"
      height="46"
      viewBox="0 0 46 46"
      class="check"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M23 0.628906C10.6435 0.628906 0.628906 10.6436 0.628906 23.0002C0.628906 35.3565 10.6435 45.3711 23 45.3711C35.3565 45.3711 45.3711 35.3565 45.3711 23.0002C45.3711 10.6436 35.3565 0.628906 23 0.628906ZM23 43.5814C11.6518 43.5814 2.41859 34.3481 2.41859 23.0002C2.41859 11.652 11.6518 2.41859 23 2.41859C34.3481 2.41859 43.5814 11.6519 43.5814 23.0002C43.5814 34.3481 34.3481 43.5814 23 43.5814Z"
        fill="white"
      ></path>
      <path
        d="M33.1115 14.112L31.8461 12.8466L22.9877 21.7051L14.1713 12.8886L12.9059 14.154L21.7224 22.9705L12.9059 31.7875L14.1713 33.0529L22.9877 24.2353L31.8461 33.0949L33.1115 31.8294L24.2531 22.9705L33.1115 14.112Z"
        fill="white"
      ></path>
    </svg>

    <h1>Error</h1>
    <p>Something went wrong :(</p>

    <a class="goBack" @click="toPage('dashboard')">Go back to the dashboard</a>
  </div>
</template>

<script>
import navigation from "../navigation.js";
export default {
  name: "ErrorPage",
  data() {
    return {};
  },
  methods: {},
  mixins: [navigation]
};
</script>

<style lang="scss" scoped>
.errorPage {
  width: 100%;
  height: 100%;
  background-color: #2f55df;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.check {
  padding: 70px 0 20px 0;
}

h1 {
  padding-bottom: 10px;
}

p {
  font-style: normal;
  font-weight: normal;
  font-size: 12px;
  line-height: 16px;
}

.goBack {
  position: relative;
  top: 100px;
  font-style: italic;
  font-weight: normal;
  font-size: 12px;
  line-height: 16px;
  color: #ffffff;
  cursor: pointer;
  text-decoration: underline;
}
</style>
