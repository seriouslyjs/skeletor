import { it, expect, beforeAll, afterAll } from "bun:test";
import fs from "fs";
import path from "path";
import { 
  writeFileWithDirs, 
  traverseStructure, 
  countTotalTasks, 
  createFilesAndDirectories, 
  printUsage ,
  parseArguments
} from "./skeletor.mjs";  // Import the functions

// Test directory where Skeletor will generate files and directories
const testDir = path.join(process.cwd(), "test_skeletor");

beforeAll(() => {
  // Create a test directory to avoid modifying the actual project structure
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }
});

afterAll(() => {
  // Cleanup: Remove the test directory and its contents after the test completes
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
  }
});

it("should create file with directories and respect overwrite option", (done) => {
  const filePath = path.join(testDir, "subdir", "testfile.txt");

  // Write the file for the first time
  writeFileWithDirs(filePath, "Initial content", false, (err) => {
    expect(err).toBeNull();
    expect(fs.readFileSync(filePath, "utf-8")).toBe("Initial content");

    // Try writing again without overwrite (should not change content)
    writeFileWithDirs(filePath, "New content", false, (err) => {
      expect(err).toBeNull();
      expect(fs.readFileSync(filePath, "utf-8")).toBe("Initial content");

      // Now, overwrite the file
      writeFileWithDirs(filePath, "Overwritten content", true, (err) => {
        expect(err).toBeNull();
        expect(fs.readFileSync(filePath, "utf-8")).toBe("Overwritten content");
        done();
      });
    });
  });
});

it("should traverse directory structure correctly", () => {
  const structure = {
    src: {
      "index.js": "console.log('Hello, world!');",
      components: {
        "Header.js": "// Header component",
        "Footer.js": "// Footer component"
      }
    }
  };

  // Traverse the directory structure
  const paths = Array.from(traverseStructure(testDir, structure));

  // Define the expected paths
  const expectedPaths = [
    { type: "dir", path: path.join(testDir, "src") },
    { type: "dir", path: path.join(testDir, "src", "components") },
    { type: "file", path: path.join(testDir, "src", "index.js"), content: "console.log('Hello, world!');" },
    { type: "file", path: path.join(testDir, "src", "components", "Header.js"), content: "// Header component" },
    { type: "file", path: path.join(testDir, "src", "components", "Footer.js"), content: "// Footer component" }
  ];

  // Verify that each expected path exists in the generated paths array
  expectedPaths.forEach(expected => {
    const found = paths.find(p => p.path === expected.path && p.type === expected.type);
    expect(found).toBeTruthy();
    if (expected.content) {
      expect(found.content).toBe(expected.content);
    }
  });
});

it("should create files and directories correctly", (done) => {
  const structure = {
    "src": {
      "index.js": "console.log('Hello, world!');",
      "components": {
        "Header.js": "// Header component"
      }
    }
  };

  createFilesAndDirectories(testDir, structure, false, (err, stats) => {
    expect(err).toBeNull();

    // Verify the directories and files were created
    const expectedPaths = [
      path.join(testDir, "src", "index.js"),
      path.join(testDir, "src", "components", "Header.js")
    ];

    expectedPaths.forEach(filePath => {
      expect(fs.existsSync(filePath)).toBe(true);
    });

    // Verify file content
    const indexJsContent = fs.readFileSync(path.join(testDir, "src", "index.js"), "utf-8");
    const headerJsContent = fs.readFileSync(path.join(testDir, "src", "components", "Header.js"), "utf-8");
    
    expect(indexJsContent).toBe("console.log('Hello, world!');");
    expect(headerJsContent).toBe("// Header component");
    done();
  });
});

it("should display help information when --help argument is passed", async () => {
  // Capture the console output
  const originalConsoleLog = console.log;
  let consoleOutput = "";
  console.log = (output) => consoleOutput += output;  // Mock console.log

  // Call the exported printUsage function directly
  await printUsage();

  // Verify that the output contains key phrases from the help text
  expect(consoleOutput).toContain("# Skeletor");
  expect(consoleOutput).toContain("skeletor --input structure.yaml");
  expect(consoleOutput).toContain("--input");
  expect(consoleOutput).toContain("--help");

  // Restore the original console.log
  console.log = originalConsoleLog;
});

it("should parse command-line arguments correctly", () => {
  const options = parseArguments(["--input", "structure.yaml", "--overwrite"]);
  
  expect(options.inputFilePath).toBe(path.resolve("structure.yaml"));
  expect(options.overwrite).toBe(true);
});

it("should set default options when no arguments are provided", () => {
  const options = parseArguments([]);
  
  expect(options.inputFilePath).toBe(path.resolve(".skeletorrc"));
  expect(options.overwrite).toBe(false);
});

it("should handle file creation errors", (done) => {
  const faultyPath = "/invalid/path/to/file.txt";
  writeFileWithDirs(faultyPath, "content", false, (err) => {
    expect(err).not.toBeNull();  // Expect an error to be returned
    done();
  });
});

it("should handle invalid YAML input", (done) => {
  const invalidYaml = "invalid: yaml: data";  // Invalid YAML format

  fs.writeFileSync(path.join(testDir, ".skeletorrc"), invalidYaml);
  fs.readFile(path.join(testDir, ".skeletorrc"), "utf8", (err, data) => {
    expect(() => yaml.parse(data)).toThrow();  // Expect YAML parsing to fail
    done();
  });
});

it("should create directories and display progress", (done) => {
  const structure = {
    "src": {
      "index.js": "console.log('Hello, world!');",
      "components": {
        "Header.js": "// Header component"
      }
    }
  };

  // Mock console.clear and process.stdout.write to capture progress output
  const originalConsoleClear = console.clear;
  const originalProcessWrite = process.stdout.write;
  let progressOutput = "";

  console.clear = () => {};  // No-op
  process.stdout.write = (chunk) => { progressOutput += chunk; };

  createFilesAndDirectories(testDir, structure, false, (err, stats) => {
    expect(err).toBeNull();
    expect(progressOutput).toContain("Progress: 100.00%");  // Verify progress
    console.clear = originalConsoleClear;
    process.stdout.write = originalProcessWrite;
    done();
  });
});

it("should handle empty directory structure", () => {
  const structure = {};  // No directories or files
  const paths = Array.from(traverseStructure(testDir, structure));
  
  expect(paths.length).toBe(0);  // No paths should be generated
});

it("should handle missing .skeletorrc file", (done) => {
  const missingFilePath = path.join(testDir, ".skeletorrc");

  fs.rmSync(missingFilePath, { force: true });  // Ensure file is missing
  fs.readFile(missingFilePath, "utf8", (err) => {
    expect(err).not.toBeNull();  // Expect an error when reading a non-existent file
    done();
  });
});

it("should handle error reading usage file in printUsage", async () => {
  const originalReadFileSync = fs.readFileSync;
  fs.readFileSync = () => { throw new Error("File read error"); };  // Simulate file read error

  const originalConsoleError = console.error;
  let errorOutput = "";
  console.error = (output) => { errorOutput += output; };  // Capture console.error

  await printUsage();
  expect(errorOutput).toContain("\u001B[31m");

  fs.readFileSync = originalReadFileSync;  // Restore original function
  console.error = originalConsoleError;  // Restore console.error
});

it("should correctly count the total number of tasks (directories and files)", () => {
  const structure = {
    src: {
      "index.js": "console.log('Hello, world!');",
      components: {
        "Header.js": "// Header component",
        "Footer.js": "// Footer component"
      }
    },
    config: {
      "app.config": "config content",
    }
  };

  const totalTasks = countTotalTasks(structure);

  // We expect 6 tasks in total:
  // 2 directories (src, components)
  // 4 files (index.js, Header.js, Footer.js, app.config)
  expect(totalTasks).toBe(7);
});

it("should handle file write errors gracefully", (done) => {
  const filePath = path.join(testDir, "testfile.txt");

  // Simulate a file system write error by providing an invalid path
  writeFileWithDirs("/invalid/path/to/file.txt", "content", false, (err) => {
    expect(err).not.toBeNull();
    done();
  });
});

