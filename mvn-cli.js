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
  const dockerCommandBuildOptions = {
    command: docker.sanitizeCommand(command, MAVEN_CLI_NAME),
    image: MAVEN_DOCKER_IMAGE,
  };

  let shellEnvironmentalVariables = {};

  if (workingDirectory) {
    await assertPathExistence(workingDirectory);
    const volumeDefinition = docker.createVolumeDefinition(workingDirectory);

    const dockerEnvironmentalVariables = {
      [volumeDefinition.mountPoint.name]: volumeDefinition.mountPoint.value,
    };

    shellEnvironmentalVariables = {
      ...dockerEnvironmentalVariables,
      [volumeDefinition.path.name]: volumeDefinition.path.value,
    };

    dockerCommandBuildOptions.environmentVariables = dockerEnvironmentalVariables;
    dockerCommandBuildOptions.volumeDefinitionsArray = [volumeDefinition];
    dockerCommandBuildOptions.workingDirectory = volumeDefinition.mountPoint.value;
  }

  const dockerCommand = docker.buildDockerCommand(dockerCommandBuildOptions);

  const commandOutput = await exec(dockerCommand, {
    env: shellEnvironmentalVariables,
  }).catch((error) => {
    throw new Error(error.stderr || error.stdout || error.message || error);
  });

  if (commandOutput.stderr && !commandOutput.stdout) {
    throw new Error(commandOutput.stderr);
  } else if (commandOutput.stdout) {
    console.error(commandOutput.stderr);
  }

  return commandOutput.stdout;
}

module.exports = {
  execute,
};
