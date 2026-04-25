<template>
  <span class="app-brand-mark" aria-hidden="true">
    <svg class="app-brand-mark__svg" viewBox="0 0 64 64" role="img" aria-label="建筑剪影校徽">
      <defs>
        <linearGradient id="crestRing" x1="14" y1="14" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#eff6ff" />
          <stop offset="1" stop-color="#dbeafe" />
        </linearGradient>
        <linearGradient id="buildingFill" x1="20" y1="20" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#f8fbff" />
          <stop offset="1" stop-color="#dbeafe" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="25" fill="none" stroke="url(#crestRing)" stroke-width="2.2" />
      <path d="M32 12.8l1.2 2.2 2.4.4-1.7 1.6.4 2.3-2.3-1.1-2.3 1.1.4-2.3-1.7-1.6 2.4-.4z" fill="#f8fafc" />
      <g fill="url(#buildingFill)">
        <path d="M19 44h26v2.6H19z" />
        <path d="M24 27h16v17H24z" />
        <path d="M28 20h8v7h-8z" />
        <path d="M19.8 31h3.2v13h-3.2zM41 31h3.2v13H41z" />
        <path d="M30.2 37h3.6v7h-3.6z" />
      </g>
      <g fill="rgba(248, 250, 252, 0.75)">
        <path d="M26.8 31h1.8v1.8h-1.8zM30.1 31h1.8v1.8h-1.8zM33.4 31h1.8v1.8h-1.8z" />
        <path d="M26.8 34.2h1.8V36h-1.8zM30.1 34.2h1.8V36h-1.8zM33.4 34.2h1.8V36h-1.8z" />
      </g>
      <path
        d="M20.6 45.6c2.2 2.6 4.8 4.3 7.8 5.2M18.8 42.8c1.2.8 2.4 1.8 3.5 3"
        stroke="rgba(248, 250, 252, 0.72)"
        stroke-width="1.3"
        stroke-linecap="round"
      />
      <path
        d="M43.4 45.6c-2.2 2.6-4.8 4.3-7.8 5.2M45.2 42.8c-1.2.8-2.4 1.8-3.5 3"
        stroke="rgba(248, 250, 252, 0.72)"
        stroke-width="1.3"
        stroke-linecap="round"
      />
      <path
        d="M25.5 47.8c2.1-.6 4.2-.9 6.5-.9s4.4.3 6.5.9"
        stroke="rgba(248, 250, 252, 0.82)"
        stroke-width="1.2"
        stroke-linecap="round"
      />
      <path d="M24.8 49.3h14.4v1.7l-7.2 1.5-7.2-1.5z" fill="rgba(239, 246, 255, 0.75)" />
      <path d="M32 15l2.5 3.4h-5L32 15z" fill="#f8fafc" />
    </svg>
  </span>
</template>

<style scoped>
.app-brand-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  flex-shrink: 0;
  color: #fff;
  background:
    linear-gradient(155deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 48%),
    linear-gradient(145deg, #7aa2ff 0%, var(--brand, #3b82f6) 45%, #1d4ed8 100%);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow:
    0 4px 16px rgba(37, 99, 235, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.38);
  transition:
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.22s ease;
}

.app-brand-mark__svg {
  width: 36px;
  height: 36px;
  filter: none;
}
</style>
