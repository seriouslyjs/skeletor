import { it, expect, beforeAll, afterAll } from "bun:test";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

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

it("should generate the expected directory structure from the .skeletorrc file", () => {
  // Copy the .skeletorrc file from the fixtures folder into the test directory
  const skeletorConfigPath = path.join(process.cwd(), "fixtures", ".skeletorrc");
  const testConfigPath = path.join(testDir, ".skeletorrc");
  fs.copyFileSync(skeletorConfigPath, testConfigPath);

  // Run Skeletor from within the test directory
  execSync(`../skeletor.mjs`, { cwd: testDir });

  // Expected directories and files (a subset for illustration, you can add more)
  const expectedPaths = [
    path.join(testDir, "src", "main", "java", "com", "example", "app", "controllers", "UserController.java"),
    path.join(testDir, "src", "main", "java", "com", "example", "app", "models", "User.java"),
    path.join(testDir, "config", "dev", "application-dev.properties"),
    path.join(testDir, "scripts", "build", "build.sh"),
    path.join(testDir, "sql", "migrations", "V1__create_users_table.sql")
  ];

  // Verify each expected file and directory exists
  expectedPaths.forEach((filePath) => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  // Verify file content (example for one file)
  const userControllerContent = fs.readFileSync(path.join(testDir, "src", "main", "java", "com", "example", "app", "controllers", "UserController.java"), "utf-8");
  expect(userControllerContent).toContain("package com.example.app.controllers;");
});

it("should correctly use the --input argument to generate the structure", () => {
  // Copy the .skeletorrc file from the fixtures folder into the test directory
  const skeletorConfigPath = path.join(process.cwd(), "fixtures", ".skeletorrc");
  const testInputPath = path.join(testDir, "input.yaml");
  fs.copyFileSync(skeletorConfigPath, testInputPath);

  // Run Skeletor with the --input argument
  execSync(`../skeletor.mjs --input input.yaml`, { cwd: testDir });

  // Expected file
  const expectedFile = path.join(testDir, "src", "main", "java", "com", "example", "app", "controllers", "ProductController.java");

  // Verify the file exists
  expect(fs.existsSync(expectedFile)).toBe(true);

  // Verify the content of the file
  const productControllerContent = fs.readFileSync(expectedFile, "utf-8");
  expect(productControllerContent).toContain("package com.example.app.controllers;");
});

it("should display help information when --help argument is passed", () => {
  try {
    // Capture the output of the --help command
    const helpOutput = execSync(`bun skeletor.mjs --help`, { encoding: "utf-8" });

    // Verify that the output contains key phrases from the help text
    expect(helpOutput).toContain("# Skeletor"); // Check for 'Usage' section
    expect(helpOutput).toContain("Create a .skeletorrc or another YAML file"); // Part of description
    expect(helpOutput).toContain("--input"); // Check for --input option
    expect(helpOutput).toContain("--help"); // Check for --help option
  } catch (err) {
    throw new Error("Failed to display help information");
  }
});
