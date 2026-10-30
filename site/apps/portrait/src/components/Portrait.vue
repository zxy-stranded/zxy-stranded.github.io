<script setup>
defineProps({
  name: { type: String, default: "苏轼" },
  group: { type: String, default: "D" },
  compact: Boolean,
});
</script>
<template>
  <div
    class="portrait-illustration"
    :class="[{ compact }, 'portrait-' + group]"
    role="img"
    :aria-label="name + '的原创风格化人物剪影，不是历史肖像复原'"
  >
    <svg viewBox="0 0 260 280" aria-hidden="true">
      <defs>
        <pattern
          id="lines"
          width="18"
          height="18"
          patternUnits="userSpaceOnUse"
        >
          <path d="M0 18L18 0" stroke="currentColor" opacity=".07" />
        </pattern>
      </defs>
      <circle cx="130" cy="123" r="100" class="portrait-disc" />
      <circle cx="130" cy="123" r="85" fill="url(#lines)" />
      <path
        d="M10 215q35-50 70-23 50-65 91-13 34-32 79 26v57H10Z"
        class="portrait-mountain"
      />
      <path d="M62 264q4-78 47-105h46q45 32 49 105Z" class="portrait-robe" />
      <path d="M111 160l20 48 26-47-10-14h-26Z" fill="#ece4cf" />
      <path
        d="M106 151q-21-17-16-50 2-33 38-35 34 3 35 37 3 29-20 47l-17 12Z"
        fill="#c5ab84"
      />
      <path d="M88 106q-7-45 39-45 43 0 40 48l-18-32-39 9Z" fill="#32463c" />
      <template v-if="['A', 'E', 'F'].includes(group)">
        <path d="M86 84l7-34 32-13 34 13 9 34-39-8Z" fill="#354b3e" />
        <path
          d="M108 47l23-26 20 28"
          fill="none"
          stroke="#849270"
          stroke-width="7"
        />
        <path
          d="M82 259l8-54 38 27 44-27 10 54"
          fill="none"
          stroke="#a9b295"
          stroke-width="3"
        />
      </template>
      <template v-else-if="['李清照', '武则天'].includes(name)">
        <path
          d="M85 89q-5-45 30-43 3-28 27-12 18 13 10 27 24 2 21 30Z"
          fill="#354b3e"
        />
        <path d="M146 144q14-26 24-40l7 52" fill="#354b3e" />
      </template>
      <template v-else>
        <path d="M87 81l-4-26 40-11 40 12 5 25Z" fill="#354b3e" />
        <path d="M73 83q55-10 111-1l-5 10q-54-5-101 4Z" fill="#354b3e" />
      </template>
      <path d="M106 116l10-2m23 0 11 2" stroke="#596348" stroke-width="2" />
      <path
        v-if="!['李清照', '武则天'].includes(name)"
        d="M113 138q16 12 30-1l-4 22-12 19-10-20Z"
        fill="#596348"
      />
      <path d="M126 117l-3 12 8 1" fill="none" stroke="#ad916c" />
      <path
        d="M93 192l35 42 43-43m-51-10-7 58 18 22"
        fill="none"
        stroke="#b9c0a7"
        stroke-width="2"
      />
      <path d="M147 223l37-15-1 34-37 16Z" fill="#e9dfc4" stroke="#8c9478" />
      <path d="M152 228l24-10m-24 16 24-10m-24 16 24-10" stroke="#a1a58a" />
      <path
        d="M28 145l-5-35m2 13-9-9m11 22 8-10"
        fill="none"
        stroke="#899b77"
      />
    </svg>
    <span class="portrait-signature">{{ name }}</span
    ><span class="portrait-caption">HISTORICAL PORTRAIT</span>
  </div>
</template>
