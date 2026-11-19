const makeStatusIconData = ({
  id,
  fill,
  stroke,
  shadow,
}: {
  id: string;
  fill: string;
  stroke: string;
  shadow: string;
}) => `
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_${id})">
    <mask id="path-1-inside-1_${id}" fill="white">
    <path d="M7 8C7 7.44772 7.44772 7 8 7H22C22.5523 7 23 7.44772 23 8V22C23 22.5523 22.5523 23 22 23H8C7.44772 23 7 22.5523 7 22V8Z"/>
    </mask>
    <path d="M7 8C7 7.44772 7.44772 7 8 7H22C22.5523 7 23 7.44772 23 8V22C23 22.5523 22.5523 23 22 23H8C7.44772 23 7 22.5523 7 22V8Z" fill="${fill}"/>
    <path d="M7 7H23H7ZM23 23H7H23ZM8 23C6.34315 23 5 21.6569 5 20V10C5 8.34315 6.34315 7 8 7H9C9 7 9 7.44772 9 8V22C9 22.5523 9 23 9 23H8ZM23 7V23V7Z" fill="${stroke}" mask="url(#path-1-inside-1_${id})"/>
    </g>
    <defs>
    <filter id="filter0_d_${id}" x="2" y="4" width="26" height="26" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feFlood flood-opacity="0" result="BackgroundImageFix"/>
    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
    <feMorphology radius="1" operator="erode" in="SourceAlpha" result="effect1_dropShadow_${id}"/>
    <feOffset dy="2"/>
    <feGaussianBlur stdDeviation="3"/>
    <feColorMatrix type="matrix" values="${shadow}"/>
    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_${id}"/>
    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_${id}" result="shape"/>
    </filter>
    </defs>
    </svg>
  `;

export const statusDraftIcon = {
  data: makeStatusIconData({
    id: 'status_draft',
    fill: '#ACB4BD',
    stroke: '#131B22',
    shadow: '0 0 0 0 0.67451 0 0 0 0 0.705882 0 0 0 0 0.741176 0 0 0 0.4 0',
  }),
  name: 'status-draft' as const,
};

export const statusInReviewIcon = {
  data: makeStatusIconData({
    id: 'status_in_review',
    fill: '#F59E0B',
    stroke: '#78350F',
    shadow: '0 0 0 0 0.960784 0 0 0 0 0.619608 0 0 0 0 0.0431373 0 0 0 0.4 0',
  }),
  name: 'status-in-review' as const,
};

export const statusReviewedIcon = {
  data: makeStatusIconData({
    id: 'status_reviewed',
    fill: '#14AFB8',
    stroke: '#13474E',
    shadow: '0 0 0 0 0.0784314 0 0 0 0 0.686275 0 0 0 0 0.721569 0 0 0 0.4 0',
  }),
  name: 'status-reviewed' as const,
};
