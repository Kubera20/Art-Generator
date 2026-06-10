<template>
  <div id="app">
    <ArtGenerator />
  </div>
</template>

<script>
import ArtGenerator from './components/ArtGenerator.vue';

export default {
  components: {
    ArtGenerator,
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>