import { createRouter, createWebHistory } from 'vue-router';

// import P5Art from './components/P5Art.vue'; // P5.js Art Component
import ArtGenerator from './components/ArtGenerator.vue'; // Camera and Art Generator Component

const routes = [
  {
    path: '/',
    component: ArtGenerator, // Default route with camera and art generation
    name: 'ArtGenerator',
  },
  // {
    // path: '/p5art',
    // component: P5Art, // Route to access only the P5.js art
    // name: 'p5art',
    // props: route => ({ 
      // capturedImage: route.query.image || null 
    // })
  // },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;