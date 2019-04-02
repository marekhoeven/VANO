<template>
  <div class="app">
    <MainHeader></MainHeader>
    <router-view></router-view>
  </div>
</template>

<script>
import MainHeader from "./MainHeader";
export default {
  name: "app",
  data() {
    return {};
  },
  created() {
    this.$bus.onMessage.addListener(this.bgMessages);
  },
  methods: {
    bgMessages(msg, sender) {
      if (msg.action === "toPage") {
        this.$router.push({ name: msg.data });
      }
    }
  },
  components: { MainHeader }
};
</script>

<style lang="scss">
@font-face {
  font-family: "RobotoMonoBold";
  src: url("../fonts/RobotoMono-Bold.ttf") format("truetype");
}

@font-face {
  font-family: "RobotoMonoMedium";
  src: url("../fonts/RobotoMono-Medium.ttf") format("truetype");
}

@font-face {
  font-family: "RubikRegular";
  src: url("../fonts/Rubik-Regular.ttf") format("truetype");
}

@font-face {
  font-family: "RubikItalic";
  src: url("../fonts/Rubik-Italic.ttf") format("truetype");
}

@font-face {
  font-family: "RubikMedium";
  src: url("../fonts/Rubik-Medium.ttf") format("truetype");
}

@font-face {
  font-family: "RubikBlack";
  src: url("../fonts/Rubik-Black.ttf") format("truetype");
}

$primary_color: #2f55df;
$font_color: #222426;

html,
body {
  padding: 0;
  margin: 0;
  background: #f7f7f7;
  color: $font_color;
  font-family: "RubikRegular", sans-serif;
  font-weight: 400;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 280px;
  height: 390px;
}

.app {
  width: 100%;
  height: 100%;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: "RubikMedium", sans-serif;
  margin: 0;
  padding: 0;
  font-weight: 0;
}

h1 {
  font-style: normal;
  font-weight: 500;
  line-height: 23px;
  font-size: 18px;
  color: #ffffff;
  position: relative;
  top: 5px;
}

p {
  line-height: 16px;
  font-size: 12px;
  color: #ffffff;
  padding: 0;
}

.container {
  display: block;
  margin: 0 auto;
  width: 230px;
}

.header {
  background-color: $primary_color;
  display: flex;
  align-items: flex-end;
  height: 160px;
  font-family: "RubikMedium", sans-serif;
  .headerText {
    p {
      padding-bottom: 10px;
    }
  }
}

.error {
  border: 1px solid #df4b54 !important;
}

.bold {
  font-family: "RubikMedium", sans-serif;
}

.no-hl {
  user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;
  -o-user-select: none;
  -moz-user-select: none;
}

button,
input {
  outline: none;
}

button {
  transition: all 0.6s ease;
  &:hover {
    background-color: #162b79;
  }
}

button {
  border: none;
  border-radius: 2px;
  color: #fff;
  font-style: normal;
  font-size: 14px;
  background-color: #2f55df;
  width: 100%;
  height: 40px;
  cursor: pointer;
  transition: background-color 0.6s ease;
  &:hover {
    background-color: #162b79;
  }
}

a {
  color: $font_color;
  text-decoration: none;
}
</style>



