<div align="center">
  <img src="./skeletor.webp" alt="Skeletor Icon" width="150" />
</div>

# Skeletor - Fast and Flexible Directory Structure Generator

[Skeletor](https://www.npmjs.com/package/@seriously/skeletor) is an ultra-fast, customizable CLI tool for generating directory structures **and files with content** based on YAML configuration files. Perfect for scaffolding projects, organizing file hierarchies, or automating file generation tasks.

> **Why Skeletor?**  
> As someone who frequently sets up new projects, I found existing tools either too complex or too rigid, which led me to create **Skeletor**. It allows me to have **complete control** over the structure and contents of my projects, without the bloat or restrictions of other generators. If you're tired of overly complicated tools like I was, you'll appreciate Skeletor's simplicity and speed.

## Key Features
- **Blazing Fast**: Generate thousands of files and folders in under a second.
- **Files with Content**: Define files with pre-written content directly in the configuration using YAML.
- **Flexible Configuration**: Supports YAML format for easy customization.
- **Non-Destructive**: Keeps your existing files safe by default, with the option to overwrite if needed.
- **Cross-Platform**: Works seamlessly on Linux, macOS, and Windows.

## Why Use Skeletor?
If you're a developer or system administrator who frequently needs to set up or scaffold directory structures for new projects, Skeletor is the ideal tool. It's perfect for:
- Rapid **project scaffolding**.
- Organizing complex **file hierarchies**.
- Automating **directory and file creation** with **pre-defined content**.

### Installation

Install Skeletor globally using npm:

```bash
npm install -g @seriously/skeletor
```

### Usage

You can use Skeletor by running the `skeletor` command in your terminal. It automatically detects the `.skeletorrc` file in your current directory or can work with a specified input YAML file.

#### Automatic detection of `.skeletorrc`

```bash
skeletor
```

#### Using a custom YAML configuration

```bash
skeletor --input structure.yaml
```

### Options

- `--input <file>`: Path to the input YAML file describing the directory structure and file content.
- `--help`: Display help information for the Skeletor CLI.
- `--overwrite`: Overwrite existing files and directories if they already exist.

### Configuration File Format

Skeletor uses a simple YAML format for defining directory structures and file contents. The configuration file should include a `directories` key with nested objects representing the desired folder and file structure.

Here’s an example of a `structure.yaml` (or `.skeletorrc`) configuration:

```yaml
directories:
  src:
    index.js: |
      console.log('Hello, world!');
    components:
      Header.js: |
        // Header component
      Footer.js: |
        // Footer component
  README.md: |
    # Project Title
    Description of the project.
```

This example creates a `src` directory with an `index.js` file and a `components` subdirectory containing `Header.js` and `Footer.js`, each with predefined content. It also creates a `README.md` file with initial content at the root level.

### Non-Destructive Creation

By default, Skeletor does not overwrite existing files or directories, ensuring that your existing work is safe. If files already exist in the target locations, they will be left untouched unless you specify the `--overwrite` option.

### Why Choose Skeletor?

- **Speed**: Skeletor is designed for speed. It can generate 1,000 files with content and 1,000 nested folders in approximately **257 ms** (after removing all the `console.log` statements!), making it the perfect tool for rapid prototyping and project scaffolding.
- **Files with Embedded Content**: Pre-define file contents directly in the configuration, reducing the need for manual edits after scaffolding.
- **Overwrite Capability**: With the `--overwrite` option, you have full control over whether files should be replaced or left untouched.
- **Flexibility**: You can customise your directory structures with any content, and Skeletor adapts to your needs with ease.
- **Efficiency**: It’s the go-to tool for developers who frequently scaffold new projects or need to organise file systems in bulk.

## License
Skeletor is released under the MIT License. See the [LICENSE](LICENSE) file for more details.