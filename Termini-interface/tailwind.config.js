/* eslint-disable */
import range from 'lodash/range';
import fromPairs from 'lodash/fromPairs';
import merge from 'lodash/merge';

/**
 * @type {import('tailwindcss/types/config').PluginCreator}
 */
function customUtilsPlugin({ addUtilities, matchUtilities, matchVariant, addVariant, theme }) {
  addUtilities({
    ".scrollbar-hide": {
      "scrollbar-width": "none",
      "-ms-overflow-style": "none",
      "&::-webkit-scrollbar": {
        display: "none",
      },
    }
  });

  addVariant("desktop-hover", [`@media (hover: hover) {&:not(:active):hover}`]);
  addVariant("we-hover", [`@media (hover: hover) {&:hover}`, `@media (hover: none) {&:active}`]);
  addVariant("group-we-hover", [
    `@media (hover: hover) {:merge(.group):hover &}`,
    `@media (hover: none) {:merge(.group):active &}`,
  ]);
}

/**
 * @type {import('tailwindcss/types/config').PluginCreator}
 */
function fontComponentsPlugin({ addComponents, addBase }) {
  addBase({
    ":root": {
      "--font-size-h1": "3.4rem",
      "--font-size-h2": "2.4rem",
      "--font-size-body-large": "1.6rem",
      "--font-size-body-medium": "1.4rem",
      "--font-size-body-small": "1.2rem",
      "--font-size-caption": "1rem",

      "--line-height-h1": "34px",
      "--line-height-h2": "24px",
      "--line-height-body-large": "2.1rem",
      "--line-height-body-medium": "1.8rem",
      "--line-height-body-small": "1.6rem",
      "--line-height-caption": "1.4rem",
    },
  });

  addComponents({
    ".text-h1": {
      fontSize: "3.4rem",
      lineHeight: "auto",
    },
    ".text-h2": {
      fontSize: "2.4rem",
      lineHeight: "auto",
    },
    ".text-body-large": {
      fontSize: "1.6rem",
      lineHeight: "2.1rem",
    },
    ".text-body-medium": {
      fontSize: "1.4rem",
      lineHeight: "1.8rem",
    },
    ".text-body-small": {
      fontSize: "1.2rem",
      lineHeight: "1.6rem",
    },
    ".text-caption": {
      fontSize: "1rem",
      lineHeight: "1.4rem",
    },
  });
}

/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    // @see https://tailwindcss.com/docs/customizing-spacing
    spacing: fromPairs(range(0, 96 + 1).map((spacing) => [spacing, `${spacing}px`])),
    borderRadius: merge(fromPairs(range(0, 96 + 1).map((borderRadius) => [borderRadius, `${borderRadius}px`])), {
      full: "9999px",
    }),
    fontSize: {
      12: "1.2rem",
      14: "1.4rem",
      15: "1.5rem",
      16: "1.6rem",
      24: "2.4rem",
      34: "3.4rem",
    },
    lineHeight: {
      1: "1",
      2: "2",
      // Normal is browser dependent. See https://developer.mozilla.org/en-US/docs/Web/CSS/line-height#normal
      base: "normal",
    },
    // @see https://tailwindcss.com/docs/customizing-colors
    placeholderColor: {
      gray: "rgb(117, 117, 117)",
    },
    // @see https://tailwindcss.com/blog/tailwindcss-v3-2#max-width-and-dynamic-breakpoints
    // "these features will only be available if your project uses a simple screens configuration."
    // So we just copy the default screens config
    screens: {
      'xs': '400px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      gridTemplateColumns: fromPairs(
        range(200, 501, 50).map((space) => [`auto-fill-${space}`, `repeat(auto-fill, minmax(${space}px, 1fr))`])
      ),
    },
  },
  plugins: [customUtilsPlugin, fontComponentsPlugin],
};

export default config;
