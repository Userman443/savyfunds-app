import React from "react";

export const FinancialIcons = {
  Chart: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <path
        d="M21 21H3V3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 9L15 15L9 9L3 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Money: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 6V18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15 9H10.5C9.67157 9 9 9.67157 9 10.5C9 11.3284 9.67157 12 10.5 12H13.5C14.3284 12 15 12.6716 15 13.5C15 14.3284 14.3284 15 13.5 15H9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Banking: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <path
        d="M3 21H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 21V7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 21V7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 21V13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 21V13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 3L22 7H2L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Shield: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <path
        d="M12 22C12 22 20 18 20 12V4L12 2L4 4V12C4 18 12 22 12 22Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Goal: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  ),
  Savings: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <path
        d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 14C16 15.1046 15.1046 16 14 16C12.8954 16 12 15.1046 12 14C12 12.8954 12.8954 12 14 12C15.1046 12 16 12.8954 16 14Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16 8H8M16 11H12M12 14H3M21 14H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  WavePattern: () => (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="text-primary-600 opacity-30">
      <path fill="currentColor" d="M42.7,-76.4C53.2,-69.8,58.5,-53.7,65.3,-39.2C72.1,-24.7,80.3,-12.4,81.2,0.5C82.1,13.4,75.7,26.8,67.5,38.4C59.3,50,49.3,59.9,37.7,62.3C26.1,64.8,13,59.8,-0.8,61.1C-14.6,62.5,-29.2,70.2,-41.9,68.7C-54.6,67.3,-65.2,56.6,-70.9,43.5C-76.5,30.3,-77.1,14.7,-76.7,-0.2C-76.3,-15.1,-74.9,-30.1,-67.7,-41.4C-60.5,-52.7,-47.5,-60.2,-34.8,-65.5C-22.1,-70.8,-11,-74,2.7,-78.7C16.5,-83.4,32.9,-89.6,42.7,-76.4Z" transform="translate(100 100)" />
    </svg>
  )
};
