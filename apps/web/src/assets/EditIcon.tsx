const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 0 24 24"
  >
    <g
      fill="none"
      stroke="rgb(83, 212, 107)"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
    >
      <path
        strokeDasharray={44}
        strokeDashoffset={44}
        d="M7 17v-4l10 -10l4 4l-10 10h-4"
      >
        <animate
          fill="freeze"
          attributeName="stroke-dashoffset"
          begin="0.5s"
          dur="0.5s"
          to={0}
        ></animate>
      </path>
      <path strokeDasharray={20} d="M3 21h18">
        <animate
          fill="freeze"
          attributeName="stroke-dashoffset"
          dur="0.5s"
          values="20;0"
        ></animate>
      </path>
      <path strokeDasharray={8} strokeDashoffset={8} d="M14 6l4 4">
        <animate
          fill="freeze"
          attributeName="stroke-dashoffset"
          begin="1.64s"
          dur="0.41s"
          to={0}
        ></animate>
      </path>
    </g>
  </svg>
);
export default EditIcon;
