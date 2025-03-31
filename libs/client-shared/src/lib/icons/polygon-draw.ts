export const polygonDraw = {
  data: `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.0017 11.0001L11.3173 10.2108C11.0016 10.0846 10.641 10.1586 10.4006 10.3991C10.1602 10.6395 10.0862 11.0001 10.2125 11.3158L11.0017 11.0001ZM15.0023 21.0001L14.2131 21.3158C14.3424 21.6391 14.6558 21.8508 15.004 21.8501C15.3522 21.8494 15.6647 21.6364 15.7927 21.3126L15.0023 21.0001ZM16.7025 16.7001L16.3901 15.9096C16.1715 15.996 15.9985 16.169 15.9121 16.3875L16.7025 16.7001ZM21.0032 15.0001L21.3157 15.7905C21.6395 15.6625 21.8525 15.35 21.8532 15.0018C21.8539 14.6536 21.6421 14.3401 21.3188 14.2108L21.0032 15.0001ZM10.0015 4.15006C9.53208 4.15006 9.15152 4.53062 9.15152 5.00006C9.15152 5.4695 9.53208 5.85006 10.0015 5.85006V4.15006ZM14.0021 5.85006C14.4716 5.85006 14.8521 5.4695 14.8521 5.00006C14.8521 4.53062 14.4716 4.15006 14.0021 4.15006V5.85006ZM10.0015 18.1501C9.53208 18.1501 9.15152 18.5306 9.15152 19.0001C9.15152 19.4695 9.53208 19.8501 10.0015 19.8501V18.1501ZM11.0017 19.8501C11.4711 19.8501 11.8517 19.4695 11.8517 19.0001C11.8517 18.5306 11.4711 18.1501 11.0017 18.1501V19.8501ZM19.8529 10.0001C19.8529 9.53062 19.4723 9.15006 19.0029 9.15006C18.5334 9.15006 18.1529 9.53062 18.1529 10.0001H19.8529ZM18.1529 11.0001C18.1529 11.4695 18.5334 11.8501 19.0029 11.8501C19.4723 11.8501 19.8529 11.4695 19.8529 11.0001H18.1529ZM5.85076 10.0001C5.85076 9.53062 5.4702 9.15006 5.00076 9.15006C4.53132 9.15006 4.15076 9.53062 4.15076 10.0001H5.85076ZM4.15076 14.0001C4.15076 14.4695 4.53132 14.8501 5.00076 14.8501C5.4702 14.8501 5.85076 14.4695 5.85076 14.0001H4.15076ZM10.2125 11.3158L14.2131 21.3158L15.7915 20.6843L11.7909 10.6843L10.2125 11.3158ZM15.7927 21.3126L17.493 17.0126L15.9121 16.3875L14.2118 20.6875L15.7927 21.3126ZM17.015 17.4905L21.3157 15.7905L20.6907 14.2096L16.3901 15.9096L17.015 17.4905ZM21.3188 14.2108L11.3173 10.2108L10.686 11.7893L20.6875 15.7893L21.3188 14.2108ZM6.35108 5.00005C6.35108 5.74551 5.74664 6.35005 5.00075 6.35005V8.05005C6.68528 8.05005 8.05108 6.68464 8.05108 5.00005H6.35108ZM5.00075 6.35005C4.25486 6.35005 3.65042 5.74551 3.65042 5.00005H1.95042C1.95042 6.68464 3.31622 8.05005 5.00075 8.05005V6.35005ZM3.65042 5.00005C3.65042 4.25459 4.25486 3.65005 5.00075 3.65005V1.95005C3.31622 1.95005 1.95042 3.31546 1.95042 5.00005H3.65042ZM5.00075 3.65005C5.74664 3.65005 6.35108 4.25459 6.35108 5.00005H8.05108C8.05108 3.31546 6.68528 1.95005 5.00075 1.95005V3.65005ZM20.3532 5.00005C20.3532 5.74551 19.7488 6.35005 19.0029 6.35005V8.05005C20.6874 8.05005 22.0532 6.68464 22.0532 5.00005H20.3532ZM19.0029 6.35005C18.257 6.35005 17.6525 5.74551 17.6525 5.00005H15.9525C15.9525 6.68464 17.3184 8.05005 19.0029 8.05005V6.35005ZM17.6525 5.00005C17.6525 4.25459 18.257 3.65005 19.0029 3.65005V1.95005C17.3184 1.95005 15.9525 3.31546 15.9525 5.00005H17.6525ZM19.0029 3.65005C19.7488 3.65005 20.3532 4.25459 20.3532 5.00005H22.0532C22.0532 3.31546 20.6874 1.95005 19.0029 1.95005V3.65005ZM6.35109 19.0001C6.35109 19.7455 5.74665 20.35 5.00076 20.35V22.0501C6.68529 22.0501 8.05109 20.6846 8.05109 19.0001H6.35109ZM5.00076 20.35C4.25487 20.35 3.65043 19.7455 3.65043 19.0001H1.95043C1.95043 20.6846 3.31623 22.0501 5.00076 22.0501V20.35ZM3.65043 19.0001C3.65043 18.2546 4.25487 17.6501 5.00076 17.6501V15.9501C3.31623 15.9501 1.95043 17.3155 1.95043 19.0001H3.65043ZM5.00076 17.6501C5.74665 17.6501 6.35109 18.2546 6.35109 19.0001H8.05109C8.05109 17.3155 6.68529 15.9501 5.00076 15.9501V17.6501ZM10.0015 5.85006H14.0021V4.15006H10.0015V5.85006ZM10.0015 19.8501H11.0017V18.1501H10.0015V19.8501ZM18.1529 10.0001V11.0001H19.8529V10.0001H18.1529ZM4.15076 10.0001V14.0001H5.85076V10.0001H4.15076Z" fill="currentColor"/>
</svg>



  `,
  name: 'polygon-draw' as const,
};
