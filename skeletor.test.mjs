import { it, expect, beforeAll, afterAll } from "bun:test";
import fs from "fs";
import path from "path";
import { 
  writeFileWithDirs, 
  traverseStructure, 
  countTotalTasks, 
  createFilesAndDirectories, 
  printUsage 
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
    "src": {
      "index.js": "console.log('Hello, world!');",
      "components": {
        "Header.js": "// Header component"
      }
    }
  };

  const paths = Array.from(traverseStructure(testDir, structure));

  // Expected paths (unordered)
  const expectedPaths = [
    { type: "dir", path: path.join(testDir, "src") },
    { type: "dir", path: path.join(testDir, "src", "components") },
    { type: "file", path: path.join(testDir, "src", "index.js"), content: "console.log('Hello, world!');" },
    { type: "file", path: path.join(testDir, "src", "components", "Header.js"), content: "// Header component" }
  ];

  // Check that paths match expectedPaths (regardless of order)
  expectedPaths.forEach(expected => {
    expect(paths).toEqual(expect.arrayContaining([expected]));
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
