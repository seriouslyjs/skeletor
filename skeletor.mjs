#!/usr/bin/env bun
import fs from "node:fs";
import path from "path";
import yaml from "yaml";
import { fileURLToPath } from 'url';

// Get the filename of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


process.stdin.resume();

const resetColor = "\x1b[0m";
const infoColor = "\x1b[36m"; // Cyan
const errorColor = "\x1b[31m"; // Red

function logInfo(...message) {
  console.log(`${infoColor}`, ...message, `${resetColor}`);
}

function logError(...message) {
  console.error(`${errorColor}`, ...message, `${resetColor}`);
}

export function writeFileWithDirs(fullPath, content, overwrite, callback) {
  fs.mkdir(path.dirname(fullPath), { recursive: true }, (err) => {
    if (err) return callback(err);

    if (!overwrite) {
      fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (!err) {
          logInfo(`File already exists: ${fullPath}`);
          return callback(null); // Treat as success, skip writing
        }
        // File does not exist, create the file
        fs.writeFile(fullPath, content, callback);
      });
    } else {
      // Overwrite the file
      fs.writeFile(fullPath, content, callback);
    }
  });
}

export function* traverseStructure(basePath, structure) {
  const stack = [{ base: basePath, struct: structure }];
  while (stack.length > 0) {
    const { base, struct } = stack.pop();
    const keys = Object.keys(struct);

    // Process keys in reverse to maintain order
    for (let i = keys.length - 1; i >= 0; i--) {
      const key = keys[i];
      const item = struct[key];
      const fullPath = path.join(base, key);

      if (typeof item === "object" && !Array.isArray(item)) {
        yield { type: "dir", path: fullPath };
        stack.push({ base: fullPath, struct: item });
      } else if (typeof item === "string") {
        yield { type: "file", path: fullPath, content: item };
      }
    }
  }
}

export function countTotalTasks(structure) {
  let totalTasks = 0;
  const stack = [structure];

  while (stack.length > 0) {
    const current = stack.pop();
    for (const key in current) {
      const item = current[key];
      totalTasks++; // Increment for each directory or file
      if (typeof item === "object" && !Array.isArray(item)) {
        stack.push(item);
      }
    }
  }
  return totalTasks;
}

export function createFilesAndDirectories(basePath, structure, overwrite, done) {
  const totalTasks = countTotalTasks(structure);
  let completedTasks = 0;
  let filesCreated = 0;
  let dirsCreated = 0;
  const taskIterator = traverseStructure(basePath, structure);
  let errorOccurred = false;

  process.stdin.resume(); // Keep the process alive (optional)

  function updateProgress(itemPath) {
    completedTasks++;
    const percentComplete = ((completedTasks / totalTasks) * 100).toFixed(2);
    console.clear();
    process.stdout.write(
      `Progress: ${percentComplete}% (${completedTasks}/${totalTasks}) - Last created: ${itemPath}`
    );
  }

  function processNext() {
    if (errorOccurred) return;

    const { value: task, done: iteratorDone } = taskIterator.next();
    if (iteratorDone) {
      process.stdout.write("\n"); // Move to the next line after completion
      return done(null, { filesCreated, dirsCreated });
    }

    if (task.type === "dir") {
      fs.mkdir(task.path, { recursive: true }, (err) => {
        if (err) {
          errorOccurred = true;
          logError(`Error creating directory: ${task.path}`, err.message);
          return printUsage().then(() => done(err));
        }
        dirsCreated++;
        updateProgress(task.path);
        processNext();
      });
    } else if (task.type === "file") {
      writeFileWithDirs(task.path, task.content, overwrite, (err) => {
        if (err) {
          errorOccurred = true;
          logError(`Error creating file: ${task.path}`, err.message);
          return printUsage().then(() => done(err));
        }
        filesCreated++;
        updateProgress(task.path);
        processNext();
      });
    }
  }

  processNext();
}

export async function printUsage() {
  try {
    // Resolve the path to skeletor-help.md relative to this script's directory
    const usageFilePath = path.join(__dirname, "skeletor-help.md");

    const usageText = fs.readFileSync(usageFilePath, "utf-8");
    // Dynamically import 'marked' and 'marked-terminal'
    const { marked } = await import("marked");
    const { markedTerminal } = await import("marked-terminal");

    // Configure marked to use marked-terminal
    marked.use(markedTerminal());

    // Parse and display the usage text
    console.log(marked.parse(usageText));
  } catch (err) {
    logError("Error reading usage file:", err.message);
  }
}

export function parseArguments(args = Bun.argv.slice(2)) {
  const options = { overwrite: false }; // Default to not overwriting files
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if ((arg === "--input" || arg === "-i") && args[i + 1]) {
      options.inputFilePath = path.resolve(args[i + 1]);
      i++; // Skip the next argument as it’s the file path
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--overwrite" || arg === "-o") {
      options.overwrite = true;
    } else {
      logError(`Unknown argument: ${arg}`);
      options.help = true;
    }
  }

  // Set default inputFilePath if not provided
  if (!options.inputFilePath) {
    options.inputFilePath = path.resolve(".skeletorrc");
  }

  return options;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArguments();

  if (options.help) {
    printUsage().then(() => process.exit(0));
  }

  const inputFilePath = options.inputFilePath || path.resolve(".skeletorrc");

  logInfo(`Reading input file: ${inputFilePath}...`);

  fs.readFile(inputFilePath, "utf8", (err, data) => {
    if (err) {
      logError(
        `\nError reading input file: ${inputFilePath}: `,
        err.message,
        "\n\n---\n"
      );
      return printUsage().then(() => process.exit(1));
    } else {
      logInfo("Input file read successfully.");
      let config;
      try {
        config = yaml.parse(data);
        logInfo(`Parsed configuration from ${inputFilePath}.`);
        if (!config || !config.directories) {
          logError(
            "\nInvalid configuration: 'directories' key is required.",
            "\n\n---\n"
          );
          return printUsage().then(() => process.exit(1));
        }
        const startTime = Date.now();
        createFilesAndDirectories(
          ".",
          config.directories,
          options.overwrite,
          (err, stats) => {
            if (err) {
              logError(
                "\nError in creating files and directories:",
                err.message,
                "\n\n---\n"
              );
              process.exit(1);
            } else {
              const endTime = Date.now();
              const timeTaken = endTime - startTime;
              logInfo(
                `\nSuccessfully generated ${stats.filesCreated} files and ${stats.dirsCreated} folders in ${timeTaken} ms.`
              );
              process.exit(0);
            }
          }
        );
      } catch (error) {
        logError("\nError parsing YAML data:", error.message, "\n\n---\n");
        return printUsage().then(() => process.exit(1));
      }
    }
  });
}


