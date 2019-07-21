const request = require('request-promise-native');
const config = require('config');
const { prompt } = require('enquirer');
const promptOpts = require('../../lib/prompts');

exports.command = 'versions:create';
exports.usage = 'versions:create <version> [options]';
exports.description = 'Create a new version for your project.';
exports.category = 'versions';
exports.weight = 4;

exports.args = [
  {
    name: 'key',
    type: String,
    description: 'Project API key',
  },
  {
    name: 'version',
    type: String,
    description: 'Project version',
  },
];

exports.run = async function(opts) {
  let versionList;
  const { key, version, codename, fork, main, beta, isPublic } = opts;

  if (!key) {
    return Promise.reject(new Error('No project API key provided. Please use `--key`.'));
  }

  if (!version) {
    return Promise.reject(
      new Error('No version provided. Please specify a semantic version using `--version`.'),
    );
  }

  if (!fork) {
    versionList = await request
      .get(`${config.host}/api/v1/version`, {
        json: true,
        auth: { user: key },
      })
      .catch(e => Promise.reject(e.error));
  }

  const promptResponse = await prompt(promptOpts.createVersionPrompt(versionList || [{}], opts));
  const options = {
    json: {
      version,
      codename: codename || '',
      is_stable: main || promptResponse.is_stable,
      is_beta: beta || promptResponse.is_beta,
      from: fork || promptResponse.from,
      is_hidden: promptResponse.is_stable ? false : !(isPublic || promptResponse.is_hidden),
    },
    auth: { user: key },
  };

  return request
    .post(`${config.host}/api/v1/version`, options)
    .then(() => Promise.resolve(`Version ${version} created successfully.`))
    .catch(err => {
      return Promise.reject(
        new Error(
          err.error && err.error.description
            ? err.error.description
            : 'Failed to create a new version using your specified parameters.',
        ),
      );
    });
};
