// forge.config.cjs — Electron Forge configuration
// Named .cjs because package.json has "type":"module"
//
// BEFORE RUNNING `npm run publish`:
//   1. Replace YOUR_GITHUB_USERNAME with your actual GitHub username
//   2. Make sure the repo "dukaan-manager" exists on GitHub
//   3. Set up GitHub Actions secrets (see .github/workflows/release.yml)

module.exports = {
  packagerConfig: {
    name: "Dukaan Manager",
    executableName: "dukaan-manager",
    // Forge automatically appends .ico on Windows, no extension on Linux
    icon: "assets/icons/icon",
    asar: true,
  },

  makers: [
    {
      // Windows — produces a Squirrel .exe installer
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "dukaan_manager",
        setupIcon: "assets/icons/icon.ico",
        // Windows code-signing (optional — skip for now, add cert path later)
        // certificateFile: process.env.WINDOWS_CERT_FILE,
        // certificatePassword: process.env.WINDOWS_CERT_PASSWORD,
      },
    },
    {
      // Linux — produces a .deb package (Ubuntu, Debian, derivatives)
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          maintainer: "Dukaan Manager",
          homepage: "https://dukaan-manager-6c75b.web.app",
        },
      },
    },
    {
      // Universal .zip fallback
      name: "@electron-forge/maker-zip",
      platforms: ["linux"],
    },
  ],

  publishers: [
    {
      // Publishes installer files to a GitHub Release on `npm run publish`
      // Triggered automatically by .github/workflows/release.yml on v* tags
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "creatorboss-design",
          name: "dukaan-manager",
        },
        prerelease: false,
        draft: false,
      },
    },
  ],
};
