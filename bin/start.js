import path from 'path';
import fs from 'fs-extra';
import https from 'https';

import { exec } from 'child_process';
import { argv, exit } from 'process';
import { fileURLToPath } from 'url';

import sourceJSON from '../package.json' assert { type: 'json' }

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PackageSpec
{
	#package
	#versionSpec

	constructor(array)
	{
		this.#package = array[0];
		this.#versionSpec = array[1];
	}

	get string()
	{
		return `${this.#package}@${this.#versionSpec}`
	}

	get package()
	{
		return this.#package;
	}
}

const excludedPackages = ['fs-extra'];

const filesToCopy =
[
	'.babelrc',
	'.browserslistrc',
	'webpack.config.js'
];

const scripts =
{
	"start": "webpack-dev-server --mode=development --open --hot",
	"build": "webpack --mode=production"
};

const buildJSON = async target =>
{
	return new Promise((resolve, reject) =>
	{
		fs.readFile(
			target,
			(error, file) =>
			{
				if (error) reject(error);

				let data = JSON.parse(file);

				data.scripts = scripts;

				fs.writeFile(target, `${JSON.stringify(data, null, '\t')}\n`)
					.catch(reject)
					.then(resolve);
			}
		);
	});
};

const copyFile = async (from, to) => 
{
	const read = fs.createReadStream(from);
	const write = fs.createWriteStream(to);

	read.pipe(write)

	return new Promise((resolve, reject) =>
	{
		write.on('finish', resolve);
		write.on('error', () => reject(`error reading ${from}`));
		read.on('error', () => reject(`error writing ${to}`));
	});
};

const downloadFile = async (url, target) =>
{
	return new Promise((resolve, reject) =>
	{
		https.get(url, response =>
		{
			let data = "";

			response.setEncoding('utf-8');

			response.on('data', d => data += d);
			response.on('error', reject);
			response.on('end', () =>
			{
				fs.writeFile(target, data, error =>
				{
					if (error) reject(error.message);
					else resolve();
				});
			});
		});
	});
};

const getPackages = (dependencies) =>
	Object.entries(dependencies)
		.map(d => new PackageSpec(d))
		.filter(d => !excludedPackages.includes(d.package))
		.map(d => d.string)
		.join(' ');

const install = async target =>
{
	return new Promise((resolve, reject) =>
	{
		const dependencies = getPackages(sourceJSON.dependencies);
		const devDependencies = getPackages(sourceJSON.devDependencies);

		exec(
			`cd ${target} && git init && node -v && npm -v && npm i -D ${devDependencies} && npm i -S ${dependencies}`,
			async (error, stdout, _stderr) =>
			{
				if (error) reject(error);

				console.log(stdout);
				console.log("Repository initialized and dependencies installed.");
				console.log("Copying additional files");

				fs.copy(path.join(__dirname, '../src'), path.join(target, 'src'))
					.catch(reject)
					.then(resolve(`All done!\n${target} is now ready!`));
			}
		);
	});
}

const initialize = async project =>
{
	return new Promise((resolve, reject) =>
	{
		console.log(`Initializing ${project}`);

		exec(
			`mkdir ${project} && cd ${project} && npm init -f`,
			async (error, _stdout, _stderr) =>
			{
				if (error) reject(`Encounted an error initializing ${project}:\n${error}`);

				const json = `${project}/package.json`;

				await buildJSON(json)
					.catch(reject)
					.then(console.log('Finished building package.json'));

				for (const file of filesToCopy)
				{
					console.log(`Copying ${file} to ${project}`);

					const from = path.join(__dirname, `../${file}`);
					const to = `${project}/${file}`;
					await copyFile(from, to).catch(reject);
				}

				console.log('Downloading .gitignore');
				
				await downloadFile(
					'https://raw.githubusercontent.com/JaseHadd/create-simple-react-app/main/.gitignore',
					`${project}/.gitignore`
				);

				console.log('Finished intialize, initializing repository and installing dependencies.')
				console.log('This may take a few minutes');

				await install(project)
					.catch(reject)
					.then(resolve);
			}
		);
	});
};

if (argv.length < 3)
{
	console.log(`Usage: ${argv[1]} package [package...]`)
	exit(1);
}

for (const project of argv.slice(2))
{
	await initialize(project).then(console.log).catch(console.error);
}
