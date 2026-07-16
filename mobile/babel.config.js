// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"], // or your RN preset
    plugins: [
      [
        "module-resolver",
        {
          alias: { "@": "./" },
          extensions: [
            ".ios.tsx",
            ".android.tsx",
            ".native.tsx",
            ".tsx",
            ".ts",
            ".js",
          ],
        },
      ],
    ],
  };
};
