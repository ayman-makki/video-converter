const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/main/preload.ts',
  target: 'electron-preload',
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'preload.js',
    path: path.resolve(__dirname, 'dist'),
  },
  externals: {
    'electron': 'commonjs2 electron'
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  optimization: {
    minimize: process.env.NODE_ENV === 'production',
  }
};