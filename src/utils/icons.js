const makeIcon = (id, svg) => ({
  id,
  src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
});

export const ICONS = [
  makeIcon(
    'man1',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <circle cx="32" cy="20" r="12" fill="#6366F1"/>
      <rect x="18" y="34" width="28" height="20" rx="10" fill="#E2E8F0"/>
      <rect x="22" y="38" width="20" height="12" rx="6" fill="#CBD5E1"/>
    </svg>`
  ),
  makeIcon(
    'man2',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <circle cx="32" cy="18" r="11" fill="#0EA5E9"/>
      <rect x="16" y="32" width="32" height="22" rx="11" fill="#F1F5F9"/>
      <rect x="20" y="36" width="24" height="14" rx="7" fill="#CBD5E1"/>
    </svg>`
  ),
  makeIcon(
    'woman1',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <circle cx="32" cy="18" r="11" fill="#A855F7"/>
      <path d="M16 50c4-10 10-16 16-16s12 6 16 16" fill="#F1F5F9"/>
      <circle cx="32" cy="36" r="8" fill="#E2E8F0"/>
    </svg>`
  ),
  makeIcon(
    'woman2',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <circle cx="32" cy="19" r="11" fill="#EC4899"/>
      <rect x="18" y="33" width="28" height="22" rx="11" fill="#F8FAFC"/>
      <rect x="22" y="37" width="20" height="14" rx="7" fill="#E2E8F0"/>
    </svg>`
  ),
  makeIcon(
    'boy',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <circle cx="32" cy="20" r="10" fill="#F59E0B"/>
      <rect x="18" y="34" width="28" height="18" rx="9" fill="#E2E8F0"/>
      <rect x="22" y="38" width="20" height="10" rx="5" fill="#CBD5E1"/>
    </svg>`
  ),
  makeIcon(
    'girl',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <circle cx="32" cy="20" r="10" fill="#10B981"/>
      <path d="M18 50c3-8 9-12 14-12s11 4 14 12" fill="#E2E8F0"/>
      <circle cx="32" cy="36" r="7" fill="#F1F5F9"/>
    </svg>`
  )
];

export function getIconById(id){
  return ICONS.find(i => i.id === id) || ICONS[0];
}
