const kaholoPluginLibrary = require("@kaholo/plugin-library");
const { execute } = require("./mvn-cli");

module.exports = kaholoPluginLibrary.bootstrap({
  testCli: () => execute({ command: "mvn --version" }),
  runCommand: execute,
});
