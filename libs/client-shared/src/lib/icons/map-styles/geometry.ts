export const geometryPointIcon = {
  data: `
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_7439_28758)">
    <circle cx="15" cy="15" r="8" fill="#14AFB8"/>
    <circle cx="15" cy="15" r="7" stroke="#13474E" stroke-width="2"/>
    </g>
    <defs>
    <filter id="filter0_d_7439_28758" x="2" y="4" width="26" height="26" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
    <feMorphology radius="1" operator="erode" in="SourceAlpha" result="effect1_dropShadow_7439_28758"/>
    <feOffset dy="2"/>
    <feGaussianBlur stdDeviation="3"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.0784314 0 0 0 0 0.686275 0 0 0 0 0.721569 0 0 0 0.4 0"/>
    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_7439_28758"/>
    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_7439_28758" result="shape"/>
    </filter>
    </defs>
    </svg>
  `,
  name: 'geometry-point' as const,
};

export const geometryLineIcon = {
  data: `
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_7439_28760)">
    <g filter="url(#filter0_d_7439_28760)">
    <path d="M6 15.0322L10.3043 7L17.5585 23L24 7.06432" stroke="#1E3A8A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <path d="M6 15.0322L10.3043 7L17.5585 23L24 7.06432" stroke="#3B82F6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <defs>
    <filter id="filter0_d_7439_28760" x="-0.500488" y="2.5" width="31.0015" height="29" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
    <feOffset dy="2"/>
    <feGaussianBlur stdDeviation="1.5"/>
    <feComposite in2="hardAlpha" operator="out"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.231373 0 0 0 0 0.509804 0 0 0 0 0.964706 0 0 0 0.3 0"/>
    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_7439_28760"/>
    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_7439_28760" result="shape"/>
    </filter>
    <clipPath id="clip0_7439_28760">
    <rect width="30" height="30" fill="white"/>
    </clipPath>
    </defs>
    </svg>
  `,
  name: 'geometry-line' as const,
};

export const geometryLineGeneralizedIcon = {
  data: `
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_12246_758)">
    <mask id="path-1-inside-1_12246_758" fill="white">
    <path d="M7.5 20C6.94772 20 6.5 19.5523 6.5 19L6.5 11C6.5 10.4477 6.94772 10 7.5 10L22.5 10C23.0523 10 23.5 10.4477 23.5 11V19C23.5 19.5523 23.0523 20 22.5 20L7.5 20Z"/>
    </mask>
    <path d="M7.5 20C6.94772 20 6.5 19.5523 6.5 19L6.5 11C6.5 10.4477 6.94772 10 7.5 10L22.5 10C23.0523 10 23.5 10.4477 23.5 11V19C23.5 19.5523 23.0523 20 22.5 20L7.5 20Z" fill="#3B82F6"/>
    <path d="M7.5 20C6.94772 20 6.5 19.5523 6.5 19L6.5 11C6.5 10.4477 6.94772 10 7.5 10L22.5 10C23.0523 10 23.5 10.4477 23.5 11V19C23.5 19.5523 23.0523 20 22.5 20L7.5 20Z" stroke="#1E3A8A" stroke-width="4" mask="url(#path-1-inside-1_12246_758)"/>
    </g>
    <defs>
    <filter id="filter0_d_12246_758" x="2.5" y="8" width="25" height="18" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
    <feOffset dy="2"/>
    <feGaussianBlur stdDeviation="2"/>
    <feComposite in2="hardAlpha" operator="out"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.231373 0 0 0 0 0.509804 0 0 0 0 0.964706 0 0 0 0.35 0"/>
    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_12246_758"/>
    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_12246_758" result="shape"/>
    </filter>
    </defs>
    </svg>
  `,
  name: 'geometry-line-generalized' as const,
};

export const geometryPolygonIcon = {
  data: `
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_7439_29634)">
    <g filter="url(#filter0_d_7439_29634)">
    <path d="M7.78751 5.63028L3.73276 14.0268C3.30937 14.9036 3.57886 15.9578 4.37104 16.5238L16.2488 25.0106C17.3076 25.7671 18.7954 25.3271 19.2723 24.1164L25.9233 7.23305C26.4403 5.92075 25.473 4.5 24.0625 4.5H9.58851C8.82104 4.5 8.12125 4.93918 7.78751 5.63028Z" fill="#F59E0B" fill-opacity="0.2"/>
    <path d="M4.63326 14.4617L8.68801 6.06514C8.85488 5.71959 9.20477 5.5 9.58851 5.5H24.0625C24.7678 5.5 25.2514 6.21037 24.9929 6.86653L18.3419 23.7498C18.1035 24.3552 17.3596 24.5752 16.8302 24.1969L4.9524 15.7102C4.55631 15.4272 4.42157 14.9001 4.63326 14.4617Z" stroke="#78350F" stroke-width="2"/>
    </g>
    </g>
    <defs>
    <filter id="filter0_d_7439_29634" x="0.533691" y="3.5" width="28.5308" height="26.884" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
    <feMorphology radius="1" operator="erode" in="SourceAlpha" result="effect1_dropShadow_7439_29634"/>
    <feOffset dy="2"/>
    <feGaussianBlur stdDeviation="2"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.960784 0 0 0 0 0.619608 0 0 0 0 0.0431373 0 0 0 0.33 0"/>
    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_7439_29634"/>
    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_7439_29634" result="shape"/>
    </filter>
    <clipPath id="clip0_7439_29634">
    <rect width="30" height="30" fill="white"/>
    </clipPath>
    </defs>
    </svg>
  `,
  name: 'geometry-polygon' as const,
};

export const geometryPolygonGeneralizedIcon = {
  data: `
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_12246_762)">
    <g filter="url(#filter0_d_12246_762)">
    <path d="M14.1318 7.26943C14.5156 6.59761 15.4843 6.59761 15.8682 7.26943L24.1451 21.7539C24.526 22.4205 24.0446 23.25 23.2768 23.25H6.72318C5.95536 23.25 5.47399 22.4205 5.85494 21.7539L14.1318 7.26943Z" fill="#F59E0B"/>
    <path d="M15 7.76557L23.2768 22.25H6.72318L15 7.76557Z" stroke="#78350F" stroke-width="2"/>
    </g>
    </g>
    <defs>
    <filter id="filter0_d_12246_762" x="0.71875" y="3.76562" width="28.5625" height="26.4844" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
    <feMorphology radius="1" operator="erode" in="SourceAlpha" result="effect1_dropShadow_12246_762"/>
    <feOffset dy="2"/>
    <feGaussianBlur stdDeviation="3"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0.960784 0 0 0 0 0.619608 0 0 0 0 0.0431373 0 0 0 0.4 0"/>
    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_12246_762"/>
    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_12246_762" result="shape"/>
    </filter>
    <clipPath id="clip0_12246_762">
    <rect width="30" height="30" fill="white"/>
    </clipPath>
    </defs>
    </svg>
  `,
  name: 'geometry-polygon-generalized' as const,
};
