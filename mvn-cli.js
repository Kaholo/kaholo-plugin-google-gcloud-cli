const { docker } = require("@kaholo/plugin-library");
const {
  join: joinPaths,
  resolve: resolvePath,
} = require("path");
const { homedir: getHomeDirectory } = require("os");
const {
  exec,
  assertPathExistence,
} = require("./helpers");
const {
  MAVEN_DOCKER_IMAGE,
  MAVEN_CLI_NAME,
  MAVEN_CACHE_DIRECTORY_NAME,
} = require("./consts.json");

async function execute({ command, workingDirectory }) {
  const dockerCommandBuildOptions = {
    command: docker.sanitizeCommand(command, MAVEN_CLI_NAME),
    image: MAVEN_DOCKER_IMAGE,
  };

  const mavenAgentCachePath = joinPaths(getHomeDirectory(), MAVEN_CACHE_DIRECTORY_NAME);
  const mavenCacheVolumeDefinition = docker.createVolumeDefinition(mavenAgentCachePath);
  // Change mount point to maven cache path
  mavenCacheVolumeDefinition.mountPoint.value = joinPaths("/root", MAVEN_CACHE_DIRECTORY_NAME);

  const dockerEnvironmentalVariables = {
    [mavenCacheVolumeDefinition.mountPoint.name]: mavenCacheVolumeDefinition.mountPoint.value,
  };
  let shellEnvironmentalVariables = {
    ...dockerEnvironmentalVariables,
    [mavenCacheVolumeDefinition.path.name]: mavenCacheVolumeDefinition.path.value,
  };

  const volumeDefinitionsArray = [mavenCacheVolumeDefinition];

  const absoluteWorkingDirectory = workingDirectory ? resolvePath(workingDirectory) : process.cwd();

  await assertPathExistence(absoluteWorkingDirectory);
  const workingDirVolumeDefinition = docker.createVolumeDefinition(absoluteWorkingDirectory);

  dockerEnvironmentalVariables[workingDirVolumeDefinition.mountPoint.name] = (
    workingDirVolumeDefinition.mountPoint.value
  );

  shellEnvironmentalVariables = {
    ...shellEnvironmentalVariables,
    ...dockerEnvironmentalVariables,
    [workingDirVolumeDefinition.path.name]: workingDirVolumeDefinition.path.value,
  };

  volumeDefinitionsArray.push(workingDirVolumeDefinition);
  dockerCommandBuildOptions.workingDirectory = workingDirVolumeDefinition.mountPoint.value;

  dockerCommandBuildOptions.volumeDefinitionsArray = volumeDefinitionsArray;
  dockerCommandBuildOptions.environmentVariables = dockerEnvironmentalVariables;

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
