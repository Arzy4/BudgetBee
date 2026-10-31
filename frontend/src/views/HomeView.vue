<template>
  <main
    class="flex min-h-screen flex-col items-center justify-center bg-[#FFF9F0] px-6 text-center"
  >
    <!-- App Name -->
    <h1 class="text-5xl font-bold tracking-tight text-[#24211D]">
      Budget<span class="text-[#D5A72B]">Bee</span>
    </h1>

    <!-- Description -->
    <p class="mt-5 max-w-md text-base leading-relaxed text-stone-600">
      Take control of your finances, track your expenses,
      and manage your budget effortlessly.
    </p>

    <!-- Login Navigation -->
    <RouterLink
      to="/login"
      class="mt-8 inline-flex items-center justify-center rounded-full bg-[#F8C94F] px-10 py-3.5 font-semibold text-[#24211D] transition-all duration-200 hover:bg-[#EAB83D] hover:shadow-lg active:scale-95"
    >
      Get Started
    </RouterLink>

    <!-- Footer -->
    <p class="mt-8 text-xs text-stone-400">
      Your money, your goals, your way.
    </p>
  </main>
</template>
