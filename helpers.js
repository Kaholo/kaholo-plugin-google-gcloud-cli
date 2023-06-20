const util = require("util");
const childProcess = require("child_process");
const { access } = require("fs/promises");
const fs = require("fs");
const {
  EMPTY_RETURN_VALUE,
} = require("./consts.json");

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

  let childProcessInstance;
  try {
    childProcessInstance = childProcess.exec(command, options);
  } catch (error) {
    throw new Error(error);
  }

  childProcessInstance.stdout.on("data", (data) => {
    onProgressFn?.(data);
  });
  childProcessInstance.stderr.on("data", (data) => {
    onProgressFn?.(data);
  });

  try {
    await util.promisify(childProcessInstance.on.bind(childProcessInstance))("close");
  } catch (error) {
    throw new Error(error);
  }

  return EMPTY_RETURN_VALUE;
}

module.exports = {
  assertPathExistence,
  asyncExec,
};
