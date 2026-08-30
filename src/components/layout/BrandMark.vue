<script setup lang="ts"></script>

<template>
  <svg
    class="brand-mark"
    viewBox="0 0 61 33"
    width="61"
    height="33"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M2.6 23.1C11 26.6 21 29.6 31 29.6C40 29 50.5 15 58 2.8"
      stroke="currentColor"
      stroke-width="5"
      stroke-linecap="round"
    />
    <circle cx="7.6" cy="10.6" r="4.1" stroke="currentColor" stroke-width="3.2" />
  </svg>
</template>

<style scoped>
/* Имя класса не «mark»: корень дочернего компонента получает и scope-id
   родителя, а в сайдбаре .mark — это точка курса 8×8, которая знак и съедала.
   Ширина считается из соотношения сторон: у svg без собственных размеров
   `width: auto` во flex-контейнере схлопывается почти в ноль. */
.brand-mark {
  height: var(--brand-mark);
  width: auto;
  aspect-ratio: 61 / 33;
  flex: 0 0 auto;
}
</style>
