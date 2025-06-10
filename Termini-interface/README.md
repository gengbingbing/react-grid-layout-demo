# Getting Started

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn`

Installs dependencies

At first installation, you might have to run `yarn husky install`,
to setup pre-commit hooks

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3010](http://localhost:3010) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console

### `yarn start-app`

Start in development mode and show the main app.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.


### Typescript

- Write a new code in Typescript as far as possible
- Components should have `.tsx` exstension
- While migration, there are some issues when using
  js components inside tsx - all props are considered as required.
  To solve this, define default values for unused props or put
  jsDoc description when this is difficult

<details>
<summary>Example</summary>

```(javascript)
/**
* @param {any} props
*/
function Button(props) {...}
```

</details>

---

### Translation

- The language code should be a valid [BCP-47](https://unicode-org.github.io/cldr-staging/charts/latest/supplemental/language_plural_rules.html) code like `es` for `Spanish`.
- The formatting used in `.po` files for each language is know as ICU MessageFormat. To understand it please refer to this [GUIDE](https://lingui.js.org/ref/message-format.html)

### SCSS

Use the following syntax to import scss modules:

```
@use "src/styles/colors";

.ClassName {
  background: colors.$color-red;
}
```

---

