const { docker } = require("@kaholo/plugin-library");
const {
  exec,
  assertPathExistence,
} = require("./helpers");
const {
  MAVEN_DOCKER_IMAGE,
  MAVEN_CLI_NAME,
} = require("./consts.json");

async function execute({ command, workingDirectory }) {
  const volumeConfigsMap = new Map();
  if (workingDirectory) {
    await assertPathExistence(workingDirectory);
    volumeConfigsMap.set("workingDirectory", docker.createVolumeConfig(workingDirectory));
  }

  const volumeConfigsArray = [...volumeConfigsMap.values()];
  const {
    environmentVariablesRequiredByDocker,
    environmentVariablesRequiredByShell,
  } = docker.extractEnvironmentVariablesFromVolumeConfigs(volumeConfigsArray);

  const sanitizedCommand = docker.sanitizeCommand(command, MAVEN_CLI_NAME);
  const dockerCommandBuildOptions = {
    command: sanitizedCommand,
    image: MAVEN_DOCKER_IMAGE,
    environmentVariables: Object.keys(environmentVariablesRequiredByDocker),
    volumeConfigs: volumeConfigsArray,
  };

  if (volumeConfigsMap.has("workingDirectory")) {
    dockerCommandBuildOptions.workingDirectory = volumeConfigsMap.get("workingDirectory").mountPoint.value;
  }

  const dockerCommand = docker.buildDockerCommand(dockerCommandBuildOptions);

  return exec(dockerCommand, {
    env: environmentVariablesRequiredByShell,
  }).catch((error) => {
    throw new Error(error.stderr || error.stdout || error.message || error);
  });
}

module.exports = {
  execute,
};
