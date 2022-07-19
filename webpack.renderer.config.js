const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
});

module.exports = {
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    fallback: {
      "https": require.resolve('https-browserify'),
      "url": require.resolve("url"),
      "http": require.resolve('stream-http'),
      "stream": require.resolve('stream-browserify')
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
};
