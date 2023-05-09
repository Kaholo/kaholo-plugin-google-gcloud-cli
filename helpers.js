const util = require("util");
const childProcess = require("child_process");
const { access } = require("fs/promises");
const fs = require("fs");

async function assertPathExistence(path) {
  try {
    await access(path, fs.constants.F_OK);
  } catch {
    throw new Error(`Path ${path} does not exist`);
  }
}

async function asyncExec(params) {
  const {
    command,
    onProgressFn,
    options = {},
  } = params;

  let childProcessError;
  let childProcessInstance;
  try {
    childProcessInstance = childProcess.exec(command, options);
  } catch (error) {
    return { error };
  }

  const outputChunks = [];

  childProcessInstance.stdout.on("data", (data) => {
    outputChunks.push({ type: "stdout", data });

    onProgressFn?.(data);
  });
  childProcessInstance.stderr.on("data", (data) => {
    outputChunks.push({ type: "stderr", data });

    onProgressFn?.(data);
  });
  childProcessInstance.on("error", (error) => {
    childProcessError = error;
  });

  try {
    await util.promisify(childProcessInstance.on.bind(childProcessInstance))("close");
  } catch (error) {
    childProcessError = error;
  }

  const outputObject = outputChunks.reduce((acc, cur) => ({
    ...acc,
    [cur.type]: `${acc[cur.type]}${cur.data.toString()}`,
  }), { stdout: "", stderr: "" });

  if (childProcessError) {
    outputObject.error = childProcessError;
  }

  return outputObject;
}

module.exports = {
  assertPathExistence,
  asyncExec,
};
