// Webpack uses this to work with directories
const path = require('path');

// This is the main configuration object.
// Here, you write different options and tell Webpack what to do
module.exports =
{
  optimization: {
    mangleExports: false,
    mangleWasmImports: false,
    chunkIds: 'named',
    minimize: false,
  },

  // Path to your entry point. From this file Webpack will begin its work
  entry: './index.js',

  // Path and filename of your result bundle.
  // Webpack will bundle all JavaScript into this file
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '',
    filename: 'bundle.js'
  },

  // Default mode for Webpack is production.
  // Depending on mode Webpack will apply different things
  // on the final bundle. For now, we don't need production's JavaScript 
  // minifying and other things, so let's set mode to development
  mode: 'production',

  resolve:
  {
    alias: {
     "@f": path.resolve(__dirname, "src/js/dom/@f")
    }
  }

};