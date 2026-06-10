import { createApp } from "vue";
import App from "./App.vue";
import router from "./router"; // Import the router
// import p5 from "p5"; // Import p5.js for sketch effects

// Create the Vue app instance
const app = createApp(App);

// Use the router
app.use(router);

// Make p5 available globally using provide/inject for better reactivity and TypeScript support
// app.provide('$p5', p5);

// Mount the app to the DOM
app.mount("#app");