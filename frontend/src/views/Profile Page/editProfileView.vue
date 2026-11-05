<script setup lang="ts">
import { ArrowLeft, UserRound, Save, LockKeyhole, Camera, CheckCircle2, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ref, onMounted, computed, onUnmounted } from 'vue'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()

const fullName = ref('')
const phoneNumber = ref('')
const fullNameError = ref('')
const phoneNumberError = ref('')

const profileImage = ref<string | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)
const imageError = ref('')
const selectedImageFile = ref<File | null>(null)

const isSubmitting = ref(false)
const submitError = ref('')
const showSuccessModal = ref(false)

const isLoadingProfile = ref(true)

const displayedProfileImage = computed(() => {
  return profileImage.value || authStore.user?.profileImage || null
})

function closeSuccessModal() {
  showSuccessModal.value = false
  router.push('/profile')
}

function goBack() {
  router.back()
}

function openImagePicker() {
  imageInput.value?.click()
}

async function handleSave() {
  if (isSubmitting.value || isLoadingProfile.value) return

  // Reset previous validation errors
  submitError.value = ''
  fullNameError.value = ''
  phoneNumberError.value = ''
  imageError.value = ''

  const trimmedFullName = fullName.value.trim()
  const trimmedPhoneNumber = phoneNumber.value.trim()

  // Validate full name
  if (!trimmedFullName) {
    fullNameError.value = 'Full name cannot be empty.'
  } else if (trimmedFullName.length > 100) {
    fullNameError.value = 'Full name cannot exceed 100 characters.'
  }

  // Validate phone number
  if (trimmedPhoneNumber && !/^\+?[0-9]{8,20}$/.test(trimmedPhoneNumber)) {
    phoneNumberError.value = 'Phone number must contain 8–20 digits, optionally starting with +.'
  }

  // Stop submission if either field is invalid
  if (fullNameError.value || phoneNumberError.value) {
    return
  }

  isSubmitting.value = true

  let profileSaved = false

  try {
    // 1. Save full name and phone number
    await authStore.saveProfile({
      fullName: trimmedFullName,
      phoneNumber: trimmedPhoneNumber || null,
    })

    profileSaved = true

    // 2. Upload profile picture if a new one was selected
    if (selectedImageFile.value) {
      await authStore.saveAvatar(selectedImageFile.value)

      selectedImageFile.value = null

      if (profileImage.value) {
        URL.revokeObjectURL(profileImage.value)
        profileImage.value = null
      }
    }

    // 3. Show success only after both operations finish
    showSuccessModal.value = true
  } catch (error) {
    console.error('Failed to update profile:', error)

    if (axios.isAxiosError(error)) {
      const data = error.response?.data

      // Profile details saved, but image upload failed
      if (profileSaved) {
        imageError.value =
          typeof data?.message === 'string'
            ? `Profile details saved, but picture upload failed: ${data.message}`
            : 'Profile details saved, but picture upload failed. Please try again.'
      } else if (error.response?.status === 400 && data?.errors) {
        const fieldErrors = data.errors.fieldErrors ?? data.errors

        fullNameError.value = fieldErrors.fullName?.[0] ?? ''
        phoneNumberError.value = fieldErrors.phoneNumber?.[0] ?? ''

        if (!fullNameError.value && !phoneNumberError.value) {
          submitError.value = data.message ?? 'Please check your profile information.'
        }
      } else {
        submitError.value =
          typeof data?.message === 'string'
            ? data.message
            : 'Failed to update profile. Please try again.'
      }
    } else {
      submitError.value = profileSaved
        ? 'Profile details saved, but picture upload failed. Please try again.'
        : 'An unexpected error occurred.'
    }
  } finally {
    isSubmitting.value = false
  }
}

function handleImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  imageError.value = ''

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    imageError.value = 'Please select a JPG, PNG, or WebP image.'
    input.value = ''
    return
  }

  if (file.size === 0 || file.size > 2 * 1024 * 1024) {
    imageError.value = 'Image size must be between 1 byte and 2 MB.'
    input.value = ''
    return
  }

  // Release the previous temporary preview URL
  if (profileImage.value) {
    URL.revokeObjectURL(profileImage.value)
  }

  selectedImageFile.value = file
  profileImage.value = URL.createObjectURL(file)

  input.value = ''
}

onMounted(async () => {
  isLoadingProfile.value = true
  submitError.value = ''

  try {
    if (!authStore.user) {
      await authStore.fetchCurrentUser()
    }

    fullName.value = authStore.user?.fullName ?? ''
    phoneNumber.value = authStore.user?.phoneNumber ?? ''
  } catch (error) {
    console.error('Failed to load user profile:', error)
    submitError.value = 'Unable to load your profile. Please try again.'
  } finally {
    isLoadingProfile.value = false
  }
})

onUnmounted(() => {
  if (profileImage.value) {
    URL.revokeObjectURL(profileImage.value)
  }
})
</script>

<template>
  <main
    class="flex h-svh flex-col overflow-hidden bg-cover bg-center bg-no-repeat px-5 py-9 pb-10"
    style="background-image: url('/images/dashboard-bg.png')"
  >
    <div class="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
      <!-- Fixed Header -->
      <header class="mb-4 flex shrink-0 items-center gap-4">
        <button
          type="button"
          aria-label="Go back"
          class="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/40 shadow-sm backdrop-blur-lg"
          @click="goBack"
        >
          <ArrowLeft :size="22" class="text-stone-800" />
        </button>
      </header>

      <!-- Page Content -->
      <div class="flex min-h-0 flex-1 flex-col">
        <div class="text-center pb-6">
          <!-- Page Title -->
          <h1 class="shrink-0 text-xl font-bold text-stone-900">Edit Profile</h1>

          <div class="h-3 mt-1">
            <p
              v-if="submitError"
              role="alert"
              class="mb-4 rounded-xl bg-red-50/90 px-4 py-3 text-center text-sm text-red-700"
            >
              {{ submitError }}
            </p>
          </div>

          <p class="mt-1 text-xs text-stone-500">Keep your account details up to date</p>
        </div>

        <!-- Scrollable Content -->
        <div class="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain pb-6">
          <!-- Edit Profile Form -->
          <form
            id="edit-profile-form"
            class="h-[65svh] space-y-5 rounded-3xl border border-white/80 bg-white/20 p-5 shadow-sm backdrop-blur-sm"
            @submit.prevent="handleSave"
          >
            <!-- Profile Avatar -->
            <section class="flex flex-col items-center py-4 text-center">
              <!-- Hidden File Input -->
              <input
                ref="imageInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="hidden"
                @change="handleImageChange"
              />

              <!-- Clickable Avatar -->
              <button
                type="button"
                aria-label="Choose profile picture"
                class="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-[#FFBA08] shadow-sm transition hover:opacity-90"
                @click="openImagePicker"
              >
                <!-- Selected Image -->
                <img
                  v-if="displayedProfileImage"
                  :src="displayedProfileImage"
                  alt="Profile picture"
                  class="h-full w-full object-cover"
                />

                <!-- Default Avatar -->
                <UserRound v-else :size="44" :stroke-width="1.7" class="text-stone-900" />

                <!-- Camera Overlay -->
                <span
                  class="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <Camera :size="25" class="text-white" />
                </span>

                <!-- Camera Badge -->
                <span
                  class="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-amber-400 shadow-sm"
                >
                  <Camera :size="14" class="text-stone-900" />
                </span>
              </button>

              <p class="mt-4 text-xs font-medium text-stone-600">
                Tap to change your profile picture
              </p>

              <p class="mt-1 text-[11px] text-stone-400">JPG, PNG or WebP · Max 2 MB</p>

              <!-- Image Validation Error -->
              <p v-if="imageError" role="alert" class="mt-3 text-xs font-medium text-red-600">
                {{ imageError }}
              </p>
            </section>

            <!-- Full Name -->
            <div>
              <label for="fullName" class="mb-2 block text-sm font-semibold text-stone-700">
                Full Name
              </label>

              <input
                id="fullName"
                v-model="fullName"
                type="text"
                autocomplete="name"
                placeholder="Enter your full name"
                :aria-invalid="!!fullNameError"
                :aria-describedby="fullNameError ? 'fullName-error' : undefined"
                class="w-full rounded-2xl border bg-white/70 px-4 py-3 text-sm text-stone-900 outline-none transition focus:ring-2"
                :class="
                  fullNameError
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                    : 'border-stone-200 focus:border-amber-400 focus:ring-amber-100'
                "
                @input="fullNameError = ''"
              />

              <!-- Full Name Validation Error -->
              <div class="h-3 mt-1">
                <p
                  v-if="fullNameError"
                  id="fullName-error"
                  role="alert"
                  class="ml-1 text-xs font-medium text-red-600"
                >
                  {{ fullNameError }}
                </p>
              </div>
            </div>

            <!-- Email Address -->
            <div>
              <label for="email" class="mb-2 block text-sm font-semibold text-stone-700">
                Email Address
              </label>

              <div class="relative">
                <input
                  id="email"
                  :value="authStore.user?.email ?? ''"
                  type="email"
                  disabled
                  class="w-full rounded-2xl border border-stone-200 bg-stone-100/70 px-4 py-3 pr-12 text-sm text-stone-500"
                />

                <LockKeyhole
                  :size="17"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
                />
              </div>

              <p class="mt-2 text-xs text-stone-500">Your email address cannot be changed.</p>
            </div>

            <!-- Phone Number -->
            <div>
              <label for="phoneNumber" class="mb-2 block text-sm font-semibold text-stone-700">
                Phone Number
              </label>

              <input
                id="phoneNumber"
                v-model="phoneNumber"
                type="tel"
                autocomplete="tel"
                placeholder="Enter your phone number"
                :aria-invalid="!!phoneNumberError"
                :aria-describedby="phoneNumberError ? 'phoneNumber-error' : undefined"
                class="w-full rounded-2xl border bg-white/70 px-4 py-3 text-sm text-stone-900 outline-none transition focus:ring-2"
                :class="
                  phoneNumberError
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                    : 'border-stone-200 focus:border-amber-400 focus:ring-amber-100'
                "
                @input="phoneNumberError = ''"
              />

              <!-- Phone Number Validation Error -->
              <p
                v-if="phoneNumberError"
                id="phoneNumber-error"
                role="alert"
                class="mt-2 text-xs font-medium text-red-600"
              >
                {{ phoneNumberError }}
              </p>

              <p class="mt-2 text-xs text-stone-500">
                Optional. Leave empty to remove your phone number.
              </p>
            </div>
          </form>
        </div>

        <!-- Fixed Save Button -->
        <div class="shrink-0">
          <button
            type="submit"
            form="edit-profile-form"
            :disabled="isSubmitting || isLoadingProfile"
            class="flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-4 py-3.5 text-sm font-bold text-stone-900 shadow-sm transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save :size="19" />

            {{
              isLoadingProfile
                ? 'Loading Profile...'
                : isSubmitting
                  ? 'Saving Changes...'
                  : 'Save Changes'
            }}
          </button>
        </div>
      </div>
    </div>
  </main>

  <!-- Success Modal -->
  <div
    v-if="showSuccessModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5 backdrop-blur-sm"
    @click.self="closeSuccessModal"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-success-title"
      class="w-full max-w-sm rounded-3xl border border-white/70 bg-[#FFF8ED]/90 p-6 shadow-2xl backdrop-blur-xl"
    >
      <div class="mb-4 flex justify-end">
        <button type="button" aria-label="Close" @click="closeSuccessModal">
          <X :size="20" class="text-stone-600" />
        </button>
      </div>

      <div class="flex flex-col items-center text-center">
        <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <CheckCircle2 :size="36" class="text-amber-600" />
        </div>

        <h2 id="profile-success-title" class="text-xl font-bold text-stone-900">
          Profile Updated!
        </h2>

        <p class="mt-2 text-sm text-stone-600">
          Your profile information has been saved successfully.
        </p>

        <button
          type="button"
          class="mt-6 w-full rounded-full bg-amber-400 py-3 font-semibold text-stone-900 transition hover:bg-amber-500"
          @click="closeSuccessModal"
        >
          Back to Profile
        </button>
      </div>
    </div>
  </div>
</template>
