# Metronic Tailwind Integration Guide

## File Structure
The tree diagram below illustrates the file structure and contents of the Metronic package.

- **design**: The complete Figma design file.
- **dist**: The destination folder that contains the compiled HTML templates and assets.
- **node_modules**: Folder containing Node.js dependencies.
- **src**: The main theme folder containing source files.
    - **app**: Folder containing application-specific code.
    - **core**: Folder containing core theme files.
        - **components**: Folder containing core components.
        - **helpers**: Folder containing helper functions and utilities.
        - **plugins**: Folder containing Tailwind CSS components.
        - **index.spa.ts**: Single Page Application (SPA) entry point file.
        - **index.ts**: Main entry point file.
        - **types.ts**: TypeScript type definitions file.
    - **css**: Folder containing CSS files for the theme.
    - **vendors**: Folder containing 3rd-party vendor libraries.
- **.eslintrc.json**: Configuration file for ESLint.
- **package.json**: Configuration file for NPM packages.
- **package-lock.json**: Lock file for NPM packages, ensuring consistent installations.
- **postcss.config.js**: Configuration file for PostCSS.
- **prettier.config.js**: Configuration file for Prettier.
- **tailwind.config.js**: Configuration file for Tailwind CSS.
- **tsconfig.json**: Configuration file for TypeScript.
- **webpack.config.js**: Main configuration file for Webpack.
- **webpack.vendors.js**: Configuration file for Webpack, specifically for vendor libraries.

---

## Installation
The steps below provide a guide for building JavaScript, CSS, fonts and vendor assets using Webpack.

1. **Download**: Download the latest Metronic from Themeforest.
2. **Install Node.js**: Install the latest LTS version of Node.js.
3. **Launch Terminal**: Start a command prompt window or terminal and change directory to the package's root directory. `cd metronic-tailwind-html-demos`
4. **Install NPM**: Install the latest NPM. `npm install --global npm@latest`
5. **Install Dependencies**: Install Metronic dependencies defined in packages.json. `npm install`
6. **Build**: Run the below command to build all assets(JavaScript, CSS, fonts, vendors) into dist/assets directory. `npm run build`
7. **Build JavaScript**: Run the below command to build JavaScript files into dist/assets/js directory. `npm run build:js`
8. **Build CSS**: Run the below command to build CSS files into dist/assets/css directory. `npm run build:css`
9. **Watch CSS**: Run the below command to watch CSS file changes to autocompile on fly into dist/assets/css directory. `npm run build:css:watch`
10. **Build for Production**: Run the following command to build production-ready assets. `npm run build:prod`

### Build Config
By default, the build output is `dist/assets`. You can change it in the config if you wish to modify the output path.
1. **Modify webpack.vendors.js**: Open the webpack.vendors.js file and update the output configuration.
2. **Modify package.json**: Open the package.json file and modify the output path.

---

## Angular Integration
You’ll find this guide tailored for those working with the official Angular boilerplate.

### Download
To get started, you'll want to grab the official Angular boilerplate.
1. **Clone the Boilerplate**:
   ```bash
   git clone https://github.com/keenthemes/metronic-tailwind-html-integration.git
   cd metronic-tailwind-html-integration/metronic-tailwind-angular
   ```
2. **Copy Metronic Assets**:
   Take the `dist/assets` folder from your Metronic Tailwind HTML package and drop its contents into `src/assets` in the Angular project.
3. **Install & Start**:
   ```bash
   npm install
   ng serve
   ```

### Integrate Metronic Assets with Angular Boilerplate
Tailwind CSS is brought in through `src/tailwind.css` (which just says `@import "tailwindcss";`), and then included in `src/styles.scss` using `@use "./tailwind";`.

For Metronic, just copy your asset folders— `media/`, `vendors/`, `js/`, `css/` —into `src/assets/`.

**Reference Metronic CSS/JS in angular.json**
The boilerplate already includes the main Metronic CSS and JS in `angular.json`. Example:
```json
"styles": [
  "src/tailwind.css",
  "src/styles.scss",
  "src/assets/vendors/apexcharts/apexcharts.css",
  "src/assets/vendors/keenicons/styles.bundle.css",
  "src/assets/css/styles.css"
],
"scripts": [
  "src/assets/js/core.bundle.js",
  "src/assets/vendors/apexcharts/apexcharts.min.js"
]
```

**Use Metronic HTML in Your Components**
Copy any HTML markup you need from your Metronic HTML package into your Angular component templates.

### Integrate Core
Metronic’s core JavaScript files are already referenced in the boilerplate’s `angular.json` under `scripts`.

**Manual Initialization (if needed)**
If you find that certain Metronic features aren’t initializing automatically, you can call their init functions in your component’s `ngAfterViewInit` lifecycle hook.
```typescript
// In your Angular component
ngAfterViewInit() {
  if (window.KTComponents) {
    window.KTComponents.init();
  }
  if (window.KTLayout) {
    window.KTLayout.init();
  }
}
```

**A Note on KTUI**
You might notice `ktui.min.js` still listed in the `angular.json` scripts. For this setup, you can safely ignore it—Metronic’s core assets are what you need. If you want to clean up, feel free to remove KTUI from the config.

---

## Starter Kits
Starter Kits provide a clean, minimal foundation for building modern web applications.

### Layouts Collection
The Metronic starter kit provides 10 different layout styles.
`views/layouts/` contains `layout-1` to `layout-10`.

### Empty Pages
Each layout in the starter kit includes an `empty/index.html` file that works as a clean starting page.

---

## Multi-demo
The multi-demo concept is a powerful design strategy that enables Metronic to offer unique layout solutions for various projects while using a common set of components and codebase.

---

## References
- **KtUI**: Free and open-source UI components for Tailwind CSS.
- **Tailwind CSS**: A utility-first CSS framework.
- **ApexCharts**: Modern & Interactive Open-source Charts.
- **Leafletjs**: Mobile-friendly interactive maps.
- **Prism.js**: Syntax highlighter.
- **Popper.js**: Positioning floating elements.
- **FormValidation**: Validation library.
- **Axios**: HTTP client.
- **Clipboard.js**: Copy text to clipboard.
- **Webpack**: Static module bundler.
