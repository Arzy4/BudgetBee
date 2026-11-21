<script setup lang="ts">
import beeMascot from '@/assets/splash/BudgetBeeIcon.png'
import ellipse from '@/assets/splash/Ellipse.svg'
import splashMask from '@/assets/splash/Union.png'

const props = defineProps<{
  isExiting?: boolean
}>()

const emit = defineEmits<{
  (e: 'exit-complete'): void
}>()

function handleAnimationEnd(event: AnimationEvent) {
  if (
    props.isExiting &&
    event.target === event.currentTarget &&
    event.animationName.startsWith('splash-slide-out')
  ) {
    emit('exit-complete')
  }
}
</script>

<template>
  <div
    class="splash-screen"
    :class="{ 'splash-exiting': isExiting }"
    @animationend="handleAnimationEnd"
  >
    <div class="splash-content">
      <!-- Bee mascot and its shadow -->
      <div class="mascot-container">
        <!-- Figma Union mask -->
        <div class="mascot-mask" :style="{ '--splash-mask': `url(${splashMask})` }">
          <!-- BudgetBee Logo -->
          <img :src="beeMascot" alt="BudgetBee Mascot" class="splash-logo" />
        </div>

        <!-- Visible ellipse -->
        <img :src="ellipse" alt="" aria-hidden="true" class="mascot-shadow" />
      </div>

      <!-- Animated text reveal -->
      <div class="splash-title-wrapper">
        <h1 class="splash-title">BUDGETBEE</h1>
      </div>
    </div>
  </div>
</template>

<style scoped>
.splash-screen {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100dvh;
  background-color: #fbbf24;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 10000;
}

/* Keep the final logo centered */
.splash-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  position: relative;
  width: max-content;

  /* Start with the bee at the screen center */
  transform: translateX(70px);

  /* Move the entire group left when the text appears */
  animation: splash-content-shift 800ms ease-in-out 3.6s both;
}

.mascot-container {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  overflow: visible;
}

.mascot-mask {
  position: absolute;
  z-index: 4;

  left: 50%;
  top: calc(55% + 31.5px - 264px);

  width: 239px;
  height: 264px;
  padding: 0;
  box-sizing: border-box;

  transform: translateX(-50%);

  -webkit-mask-image: var(--splash-mask);
  mask-image: var(--splash-mask);

  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;

  -webkit-mask-position: center;
  mask-position: center;

  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;

  overflow: visible;

  animation: remove-mask 3.6s steps(1, end) both;
}

/* Bee emergence, fall, and bounce */
.splash-logo {
  position: absolute;
  z-index: 2;

  /* Align the bee horizontally */
  left: 50%;

  /*
   * Position the bee at the same vertical
   * coordinate as the mascot container.
   *
   * Union bottom = ellipse bottom
   */
  top: calc(264px - 31.5px - 2.4px - 24px);

  width: 48px;
  height: 48px;
  max-width: none;
  object-fit: contain;

  /* Center the bee horizontally */
  margin-left: -23px;

  /* Existing animation */
  animation: mascot-bounce 3.2s linear both;
}

/* Original Figma ellipse */
.mascot-shadow {
  position: absolute;
  z-index: 3;

  left: 50%;
  top: 55%;

  width: 239px;
  height: 63px;

  max-width: none;
  object-fit: fill;

  transform: translate(-50%, -50%);

  animation: shadow-disappear 3s linear both;
}

/* Reveal title after bounce finishes */
.splash-title-wrapper {
  width: 132px;
  flex-shrink: 0;
  overflow: hidden;
  white-space: nowrap;

  clip-path: inset(0 100% 0 0);

  animation: title-reveal 800ms ease-in-out 3.6s both;
}

.splash-title {
  color: #ffffff;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
  line-height: 1.2;
  white-space: nowrap;
  margin: 0;
}

.splash-screen.splash-exiting {
  animation: splash-slide-out 750ms cubic-bezier(0.76, 0, 0.24, 1) forwards;
}

/* =================================
   BEE EMERGENCE + BOUNCE
================================= */

@keyframes mascot-bounce {
  /* Start beneath the ellipse */
  0% {
    transform: translateY(200px);
    animation-timing-function: cubic-bezier(0.35, 0, 0.65, 1);
  }

  /* Reach the highest point */
  36% {
    transform: translateY(-110px) scale(1.7);
    animation-timing-function: cubic-bezier(0.45, 0, 1, 1);
  }

  /* First landing */
  55% {
    transform: translateY(0) scale(1.4);
    animation-timing-function: cubic-bezier(0, 0, 0.25, 1);
  }

  /* First rebound */
  68% {
    transform: translateY(-45px) scale(1.6);
    animation-timing-function: cubic-bezier(0.45, 0, 1, 1);
  }

  /* Second landing */
  80% {
    transform: translateY(0) scale(1.4);
    animation-timing-function: cubic-bezier(0, 0, 0.25, 1);
  }

  /* Smaller rebound */
  89% {
    transform: translateY(-15px) scale(1.5);
    animation-timing-function: cubic-bezier(0.45, 0, 1, 1);
  }

  /* Settle */
  100% {
    transform: translateY(0) scale(1.4);
  }
}

/* =================================
   ELLIPSE SHRINKING
================================= */

@keyframes shadow-disappear {
  /*
   * Full-size ellipse while
   * the bee is still underneath.
   */
  0%,
  17% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }

  /*
   * Start shrinking once
   * the bee begins emerging.
   */
  22% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.85);
  }

  30% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.35);
  }

  /*
   * Disappear at the bee's peak.
   */
  36% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }

  /*
   * Never reappear during
   * the fall, bounce, or wordmark.
   */
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }
}

/* =================================
   WORDMARK REVEAL
================================= */

@keyframes title-reveal {
  from {
    clip-path: inset(0 100% 0 0);
    opacity: 0;
  }

  to {
    clip-path: inset(0 0 0 0);
    opacity: 1;
  }
}

@keyframes remove-mask {
  0%,
  35.99% {
    -webkit-mask-image: var(--splash-mask);
    mask-image: var(--splash-mask);
  }

  36%,
  100% {
    -webkit-mask-image: none;
    mask-image: none;
  }
}

@keyframes splash-slide-out {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-100%);
  }
}

@keyframes splash-content-shift {
  from {
    transform: translateX(70px);
  }

  to {
    transform: translateX(0);
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .splash-logo,
  .mascot-shadow,
  .splash-title-wrapper {
    animation: none;
  }

  .splash-logo {
    transform: translateY(0);
    clip-path: none;
  }

  .mascot-shadow {
    opacity: 0;
  }

  .splash-title-wrapper {
    width: auto;
    opacity: 1;
  }

  .splash-content {
    animation: none;
    transform: translateX(0);
  }
}
</style>
