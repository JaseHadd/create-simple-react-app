import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default
{
	output:
	{
		path: path.resolve(__dirname, 'build'),
		filename: 'bundle.js'
	},

	resolve:
	{
		modules: [ path.join(__dirname, 'src'), 'node_modules' ],
		alias: { react: path.join(__dirname, 'node_modules', 'react') }
	},

	module:
	{
		rules:
		[
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: { loader: 'babel-loader' }
			},
			{
				test: /\.css$/,
				use:
				[
					{ loader: 'style-loader' },
					{ loader: 'css-loader' }
				]
			}
		]
	},

	plugins:
	[
		new HtmlWebpackPlugin({ template: './src/index.html' })
	]
};
